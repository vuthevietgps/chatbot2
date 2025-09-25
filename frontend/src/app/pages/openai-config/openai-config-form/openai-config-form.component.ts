import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { OpenAIConfigService } from '../../../services/openai-config.service';
import { OpenAIConfig, OpenAIModel, OPENAI_MODELS } from '../../../models/openai-config.model';

interface DialogData {
  mode: 'create' | 'edit';
  config?: OpenAIConfig;
  scenarios: any[];
  fanpages: any[];
}

@Component({
  selector: 'app-openai-config-form',
  templateUrl: './openai-config-form.component.html',
  styleUrls: ['./openai-config-form.component.scss']
})
export class OpenAIConfigFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  availableModels: OpenAIModel[] = OPENAI_MODELS;
  
  constructor(
    private fb: FormBuilder,
    private openaiConfigService: OpenAIConfigService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<OpenAIConfigFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    // Load available models from API
    this.openaiConfigService.getAvailableModels().subscribe({
      next: (response) => {
        this.availableModels = response.data;
      },
      error: (error) => {
        console.error('Error loading models:', error);
        // Fallback to static models
      }
    });

    // Populate form if editing
    if (this.data.mode === 'edit' && this.data.config) {
      this.form.patchValue(this.data.config);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      model: ['gpt-3.5-turbo', [Validators.required]],
      apiKey: ['', [
        Validators.required, 
        Validators.pattern(/^sk-[a-zA-Z0-9]{48,}$/)
      ]],
      systemPrompt: ['Bạn là trợ lý AI thông minh và thân thiện cho fanpage bán hàng. Hãy trả lời khách hàng một cách chuyên nghiệp, ngắn gọn và hữu ích.', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]],
      maxTokens: [150, [Validators.required, Validators.min(50), Validators.max(4000)]],
      temperature: [0.7, [Validators.required, Validators.min(0), Validators.max(2)]],
      status: ['active', [Validators.required]],
      isDefault: [false],
      applicableScenarios: [[]],
      applicableFanpages: [[]]
    });
  }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Chỉnh sửa cấu hình OpenAI' : 'Tạo cấu hình OpenAI mới';
  }

  getModelInfo(modelId: string): OpenAIModel | undefined {
    return this.availableModels.find(m => m.id === modelId);
  }

  onModelChange(modelId: string): void {
    const model = this.getModelInfo(modelId);
    if (model) {
      // Auto-adjust max tokens based on model capabilities
      const currentMaxTokens = this.form.get('maxTokens')?.value || 150;
      if (currentMaxTokens > model.maxTokens) {
        this.form.get('maxTokens')?.setValue(Math.min(model.maxTokens, 150));
      }
    }
  }

  testApiKey(): void {
    const apiKey = this.form.get('apiKey')?.value;
    const model = this.form.get('model')?.value;

    if (!apiKey || !model) {
      this.snackBar.open('Vui lòng nhập API Key và chọn model', 'Đóng', { duration: 3000 });
      return;
    }

    this.loading = true;

    // Create temporary config for testing
    const tempConfig = {
      name: 'Test Config',
      model,
      apiKey,
      systemPrompt: this.form.get('systemPrompt')?.value || 'Test prompt',
      maxTokens: 50,
      temperature: 0.5,
      status: 'active' as const,
      isDefault: false,
      applicableScenarios: [],
      applicableFanpages: []
    };

    this.openaiConfigService.createConfig(tempConfig).subscribe({
      next: (config) => {
        // Test the created config
        if (config._id) {
          this.openaiConfigService.testConfig(config._id).subscribe({
            next: (result) => {
              this.loading = false;
              if (result.success) {
                this.snackBar.open('API Key hợp lệ! Test thành công.', 'Đóng', { duration: 3000 });
              } else {
                this.snackBar.open(`API Key không hợp lệ: ${result.error}`, 'Đóng', { duration: 5000 });
              }
              
              // Clean up test config
              this.openaiConfigService.deleteConfig(config._id!).subscribe();
            },
            error: (error) => {
              this.loading = false;
              this.snackBar.open('Lỗi test API Key', 'Đóng', { duration: 3000 });
              // Clean up test config
              if (config._id) {
                this.openaiConfigService.deleteConfig(config._id).subscribe();
              }
            }
          });
        }
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Lỗi test API Key', 'Đóng', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.form.value;

    const operation = this.isEditMode && this.data.config?._id
      ? this.openaiConfigService.updateConfig(this.data.config._id, formData)
      : this.openaiConfigService.createConfig(formData);

    operation.subscribe({
      next: (result) => {
        this.loading = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error saving config:', error);
        
        let errorMessage = 'Lỗi lưu cấu hình';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Dữ liệu không hợp lệ';
        } else if (error.status === 409) {
          errorMessage = 'Tên cấu hình đã tồn tại';
        }
        
        this.snackBar.open(errorMessage, 'Đóng', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Form validation helpers
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.hasError(errorType) && (field.dirty || field.touched) : false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return `${this.getFieldLabel(fieldName)} là bắt buộc`;
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} tối thiểu ${errors['minlength'].requiredLength} ký tự`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} tối đa ${errors['maxlength'].requiredLength} ký tự`;
    if (errors['min']) return `Giá trị tối thiểu là ${errors['min'].min}`;
    if (errors['max']) return `Giá trị tối đa là ${errors['max'].max}`;
    if (errors['pattern']) return 'Định dạng không hợp lệ (API Key phải bắt đầu bằng sk-)';

    return 'Dữ liệu không hợp lệ';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Tên cấu hình',
      description: 'Mô tả',
      model: 'Model',
      apiKey: 'API Key',
      systemPrompt: 'System Prompt',
      maxTokens: 'Max Tokens',
      temperature: 'Temperature'
    };
    return labels[fieldName] || fieldName;
  }
}