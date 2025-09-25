import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductGroup, ProductGroupStatus } from '../../services/product-groups.service';

@Component({
  selector: 'app-product-group-dialog',
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>{{ data?.row ? 'Chỉnh sửa' : 'Thêm mới' }} Nhóm sản phẩm</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form" class="group-form">
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tên nhóm sản phẩm *</mat-label>
            <input matInput formControlName="name" required 
                   placeholder="VD: Điện thoại di động">
            <mat-error *ngIf="form.get('name')?.hasError('required')">
              Tên nhóm sản phẩm là bắt buộc
            </mat-error>
            <mat-error *ngIf="form.get('name')?.hasError('minlength')">
              Tên phải có ít nhất 2 ký tự
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Mô tả</mat-label>
            <textarea matInput formControlName="description" rows="3"
                      placeholder="Mô tả ngắn gọn về nhóm sản phẩm này..."></textarea>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="color-field">
            <mat-label>Màu sắc *</mat-label>
            <input matInput formControlName="color" required 
                   placeholder="#3f51b5">
            <button matSuffix mat-icon-button type="button" (click)="openColorPicker()">
              <div class="color-preview" [style.background-color]="form.get('color')?.value || '#ccc'"></div>
            </button>
            <mat-error *ngIf="form.get('color')?.hasError('required')">
              Màu sắc là bắt buộc
            </mat-error>
            <mat-error *ngIf="form.get('color')?.hasError('pattern')">
              Định dạng màu không hợp lệ (VD: #FF0000)
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Trạng thái</mat-label>
            <mat-select formControlName="status">
              <mat-option value="active">Đang hoạt động</mat-option>
              <mat-option value="inactive">Tạm dừng</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- TODO: Add parent group selection when hierarchy is needed -->
        <!--
        <div class="form-row" *ngIf="parentGroups && parentGroups.length > 0">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nhóm cha (tùy chọn)</mat-label>
            <mat-select formControlName="parentGroupId">
              <mat-option value="">Không có</mat-option>
              <mat-option *ngFor="let parent of parentGroups" [value]="parent._id">
                {{ parent.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        -->

        <!-- Color Preview Section -->
        <div class="preview-section" *ngIf="form.get('color')?.value">
          <h4>Xem trước</h4>
          <div class="color-preview-card">
            <div class="color-sample" [style.background-color]="form.get('color')?.value"></div>
            <div class="preview-info">
              <div class="preview-name">{{ form.get('name')?.value || 'Tên nhóm sản phẩm' }}</div>
              <div class="preview-description">{{ form.get('description')?.value || 'Mô tả nhóm sản phẩm' }}</div>
              <div class="preview-color">{{ form.get('color')?.value }}</div>
            </div>
          </div>
        </div>

      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button color="primary" 
              [disabled]="form.invalid || loading" 
              (click)="onSave()">
        <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
        <span *ngIf="!loading">{{ data?.row ? 'Cập nhật' : 'Tạo mới' }}</span>
      </button>
    </mat-dialog-actions>

    <!-- Hidden color input for native color picker -->
    <input type="color" #colorPicker style="display: none" 
           (change)="onColorSelected($event)" />
  `,
  styles: [`
    .dialog-content {
      min-width: 450px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .group-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .full-width {
      width: 100%;
    }

    .color-field {
      flex: 1;
    }

    .color-preview {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      cursor: pointer;
    }

    .preview-section {
      margin-top: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .preview-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: #666;
    }

    .color-preview-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .color-sample {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .preview-info {
      flex: 1;
    }

    .preview-name {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .preview-description {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .preview-color {
      font-size: 11px;
      color: #999;
      font-family: monospace;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }

    @media (max-width: 600px) {
      .dialog-content {
        min-width: unset;
        width: 90vw;
      }

      .form-row {
        flex-direction: column;
      }
    }
  `]
})
export class ProductGroupDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  // parentGroups: ProductGroup[] = []; // TODO: Implement when hierarchy is needed

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { row?: ProductGroup } | null,
  ) {}

  ngOnInit() {
    const group = this.data?.row;
    
    this.form = this.fb.group({
      name: [group?.name || '', [Validators.required, Validators.minLength(2)]],
      description: [group?.description || ''],
      color: [group?.color || '#3f51b5', [
        Validators.required,
        Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      ]],
      status: [group?.status || ProductGroupStatus.ACTIVE],
      // parentGroupId: [group?.parentGroupId || null]
    });
  }

  openColorPicker() {
    const colorPicker = document.querySelector('input[type="color"]') as HTMLInputElement;
    if (colorPicker) {
      colorPicker.value = this.form.get('color')?.value || '#3f51b5';
      colorPicker.click();
    }
  }

  onColorSelected(event: any) {
    const color = event.target.value;
    this.form.patchValue({ color });
  }

  onSave() {
    if (this.form.valid) {
      this.loading = true;
      
      // Clean up form data
      const formData = { ...this.form.value };
      
      // Remove empty description
      if (!formData.description || formData.description.trim() === '') {
        delete formData.description;
      }

      setTimeout(() => {
        this.loading = false;
        this.dialogRef.close(formData);
      }, 500);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
