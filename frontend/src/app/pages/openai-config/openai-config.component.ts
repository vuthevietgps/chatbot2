import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { OpenAIConfigService } from '../../services/openai-config.service';
import { ScriptGroupsService } from '../../services/script-groups.service';
import { FanpagesService } from '../../services/fanpages.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { OpenAIConfigFormComponent } from './openai-config-form/openai-config-form.component';
import { OpenAIConfigStatsComponent } from './openai-config-stats/openai-config-stats.component';

import { OpenAIConfig, OpenAIConfigQuery } from '../../models/openai-config.model';
import { ScriptGroup } from '../../models/script-group.model';
import { Fanpage } from '../../models/fanpage.model';

@Component({
  selector: 'app-openai-config',
  templateUrl: './openai-config.component.html',
  styleUrls: ['./openai-config.component.scss']
})
export class OpenAIConfigComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = [
    'name',
    'model',
    'status',
    'isDefault',
    'scenarios',
    'fanpages',
    'totalRequests',
    'successRate',
    'lastUsedAt',
    'actions'
  ];

  dataSource = new MatTableDataSource<OpenAIConfig>([]);
  loading = false;
  totalItems = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  // Filters
  searchTerm = '';
  statusFilter = '';
  scenarioFilter = '';
  fanpageFilter = '';

  private searchSubject = new Subject<string>();

  // Reference data
  scenarios: ScriptGroup[] = [];
  fanpages: Fanpage[] = [];

  constructor(
    private openaiConfigService: OpenAIConfigService,
    private scriptGroupsService: ScriptGroupsService,
    private fanpagesService: FanpagesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.loadConfigs();
    });
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadConfigs();
  }

  /**
   * Load reference data for dropdowns
   */
  loadReferenceData(): void {
    // Load scenarios/script groups
    this.scriptGroupsService.getAll().subscribe({
      next: (response: any) => {
        this.scenarios = response.data || response;
      },
      error: (error: any) => {
        console.error('Error loading scenarios:', error);
      }
    });

    // Load fanpages
    this.fanpagesService.getAll().subscribe({
      next: (response: any) => {
        this.fanpages = response.data || response;
      },
      error: (error: any) => {
        console.error('Error loading fanpages:', error);
      }
    });
  }

  /**
   * Load OpenAI configurations
   */
  loadConfigs(): void {
    this.loading = true;

    const query: OpenAIConfigQuery = {
      page: (this.paginator?.pageIndex || 0) + 1,
      limit: this.paginator?.pageSize || this.pageSize,
      search: this.searchTerm || undefined,
      status: this.statusFilter as any || undefined,
      scenario: this.scenarioFilter || undefined,
      fanpage: this.fanpageFilter || undefined
    };

    this.openaiConfigService.getConfigs(query).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalItems = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading configs:', error);
        this.snackBar.open('Lỗi tải danh sách cấu hình OpenAI', 'Đóng', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  /**
   * Handle search input
   */
  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchTerm);
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadConfigs();
  }

  /**
   * Handle page changes
   */
  onPageChange(): void {
    this.loadConfigs();
  }

  /**
   * Open create dialog
   */
  onCreate(): void {
    const dialogRef = this.dialog.open(OpenAIConfigFormComponent, {
      width: '800px',
      data: {
        mode: 'create',
        scenarios: this.scenarios,
        fanpages: this.fanpages
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadConfigs();
        this.snackBar.open('Tạo cấu hình OpenAI thành công', 'Đóng', { duration: 3000 });
      }
    });
  }

  /**
   * Open edit dialog
   */
  onEdit(config: OpenAIConfig): void {
    const dialogRef = this.dialog.open(OpenAIConfigFormComponent, {
      width: '800px',
      data: {
        mode: 'edit',
        config: { ...config },
        scenarios: this.scenarios,
        fanpages: this.fanpages
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadConfigs();
        this.snackBar.open('Cập nhật cấu hình OpenAI thành công', 'Đóng', { duration: 3000 });
      }
    });
  }

  /**
   * Delete configuration
   */
  onDelete(config: OpenAIConfig): void {
    if (config.isDefault) {
      this.snackBar.open('Không thể xóa cấu hình mặc định', 'Đóng', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận xóa',
        message: `Bạn có chắc chắn muốn xóa cấu hình "${config.name}"?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && config._id) {
        this.openaiConfigService.deleteConfig(config._id).subscribe({
          next: () => {
            this.loadConfigs();
            this.snackBar.open('Xóa cấu hình OpenAI thành công', 'Đóng', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting config:', error);
            this.snackBar.open('Lỗi xóa cấu hình OpenAI', 'Đóng', { duration: 3000 });
          }
        });
      }
    });
  }

  /**
   * Set as default configuration
   */
  onSetDefault(config: OpenAIConfig): void {
    if (config.isDefault) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận đặt mặc định',
        message: `Bạn có muốn đặt "${config.name}" làm cấu hình mặc định?`,
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && config._id) {
        this.openaiConfigService.setAsDefault(config._id).subscribe({
          next: () => {
            this.loadConfigs();
            this.snackBar.open('Đã đặt làm cấu hình mặc định', 'Đóng', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error setting default:', error);
            this.snackBar.open('Lỗi đặt cấu hình mặc định', 'Đóng', { duration: 3000 });
          }
        });
      }
    });
  }

  /**
   * Test configuration
   */
  onTest(config: OpenAIConfig): void {
    if (!config._id) return;

    this.loading = true;
    this.openaiConfigService.testConfig(config._id).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.snackBar.open('Test thành công!', 'Đóng', { duration: 3000 });
        } else {
          this.snackBar.open(`Test thất bại: ${result.error}`, 'Đóng', { duration: 5000 });
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error testing config:', error);
        this.snackBar.open('Lỗi test cấu hình', 'Đóng', { duration: 3000 });
      }
    });
  }

  /**
   * View usage statistics
   */
  onViewStats(config: OpenAIConfig): void {
    this.dialog.open(OpenAIConfigStatsComponent, {
      width: '600px',
      data: { config }
    });
  }

  /**
   * Get scenario names for display
   */
  getScenarioNames(scenarioIds: string[]): string {
    if (!scenarioIds || scenarioIds.length === 0) return 'Không có';
    
    const names = scenarioIds.map(id => {
      const scenario = this.scenarios.find(s => s._id === id);
      return scenario?.name || 'Unknown';
    });
    
    return names.length > 2 ? `${names.slice(0, 2).join(', ')} (+${names.length - 2})` : names.join(', ');
  }

  /**
   * Get fanpage names for display
   */
  getFanpageNames(fanpageIds: string[]): string {
    if (!fanpageIds || fanpageIds.length === 0) return 'Không có';
    
    const names = fanpageIds.map(id => {
      const fanpage = this.fanpages.find(f => f._id === id);
      return fanpage?.pageName || 'Unknown';
    });
    
    return names.length > 2 ? `${names.slice(0, 2).join(', ')} (+${names.length - 2})` : names.join(', ');
  }

  /**
   * Calculate success rate for display
   */
  getSuccessRate(config: OpenAIConfig): string {
    if (!config.totalRequests || config.totalRequests === 0) return '0%';
    const rate = ((config.successfulResponses || 0) / config.totalRequests * 100).toFixed(1);
    return `${rate}%`;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Chưa sử dụng';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  /**
   * Get model display name
   */
  getModelName(modelId: string): string {
    const modelMap: { [key: string]: string } = {
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K'
    };
    return modelMap[modelId] || modelId;
  }

  /**
   * Get model color for chip display
   */
  getModelColor(modelId: string): string {
    const colorMap: { [key: string]: string } = {
      'gpt-4': 'primary',
      'gpt-4-turbo': 'accent',
      'gpt-3.5-turbo': 'warn',
      'gpt-3.5-turbo-16k': 'warn'
    };
    return colorMap[modelId] || 'primary';
  }

  /**
   * Get success rate value for calculations
   */
  getSuccessRateValue(config: OpenAIConfig): number {
    if (!config.totalRequests || config.totalRequests === 0) return 0;
    return (config.successfulResponses || 0) / config.totalRequests * 100;
  }
}