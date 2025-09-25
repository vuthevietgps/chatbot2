import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OpenAIConfigService } from '../../../services/openai-config.service';
import { OpenAIConfig, UsageStats } from '../../../models/openai-config.model';

interface DialogData {
  config: OpenAIConfig;
}

@Component({
  selector: 'app-openai-config-stats',
  templateUrl: './openai-config-stats.component.html',
  styleUrls: ['./openai-config-stats.component.scss']
})
export class OpenAIConfigStatsComponent implements OnInit {
  loading = true;
  stats: UsageStats | null = null;
  error: string | null = null;

  constructor(
    private openaiConfigService: OpenAIConfigService,
    public dialogRef: MatDialogRef<OpenAIConfigStatsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    if (!this.data.config._id) {
      this.error = 'Không thể tải thống kê';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.openaiConfigService.getUsageStats(this.data.config._id).subscribe({
      next: (response) => {
        this.stats = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.error = 'Lỗi tải thống kê sử dụng';
        this.loading = false;
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getSuccessRateColor(): string {
    if (!this.stats || this.stats.totalRequests === 0) return '#666';
    
    const rate = (this.stats.successfulResponses / this.stats.totalRequests) * 100;
    if (rate >= 90) return '#4caf50';
    if (rate >= 70) return '#ff9800';
    return '#f44336';
  }

  getSuccessRateValue(): number {
    if (!this.stats || this.stats.totalRequests === 0) return 0;
    return (this.stats.successfulResponses / this.stats.totalRequests) * 100;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Chưa sử dụng';
    return new Date(date).toLocaleString('vi-VN');
  }

  formatNumber(num: number): string {
    return num.toLocaleString('vi-VN');
  }

  getCostEstimate(): string {
    if (!this.stats || this.stats.totalTokensUsed === 0) return '$0.00';
    
    // Estimate cost based on GPT-3.5-turbo pricing
    const costPer1kTokens = 0.002; // Average cost
    const cost = (this.stats.totalTokensUsed / 1000) * costPer1kTokens;
    return `$${cost.toFixed(4)}`;
  }
}