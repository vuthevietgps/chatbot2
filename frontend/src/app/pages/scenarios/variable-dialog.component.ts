import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VarType } from '../../services/scenarios.service';

@Component({
  selector: 'app-variable-dialog',
  template: `
    <h2 mat-dialog-title>{{ data?.variable ? 'Cập nhật' : 'Thêm' }} biến</h2>
    <mat-dialog-content [formGroup]="form" class="dialog-form">
      <div class="row">
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Key</mat-label>
          <input matInput formControlName="key" placeholder="ví dụ: customer_name" required>
          <mat-error *ngIf="form.controls.key.invalid">Bắt buộc</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Kiểu dữ liệu</mat-label>
          <mat-select formControlName="type" required>
            <mat-option value="string">string</mat-option>
            <mat-option value="number">number</mat-option>
            <mat-option value="boolean">boolean</mat-option>
            <mat-option value="json">json</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div class="row">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Giá trị mặc định (JSON nếu type=json)</mat-label>
          <textarea matInput rows="3" formControlName="default_value"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Hủy</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form .row { display: flex; gap: 12px; align-items: center; }
    .w-50 { width: 50%; }
    .w-100 { width: 100%; }
  `]
})
export class VariableDialogComponent {
  form = this.fb.group({
    key: ['', Validators.required],
    type: ['string' as VarType, Validators.required],
    default_value: [''],
  });

  constructor(
    public dialogRef: MatDialogRef<VariableDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    if (data?.variable) {
      this.form.patchValue({
        key: data.variable.key,
        type: data.variable.type,
        default_value: typeof data.variable.default_value === 'object' ? JSON.stringify(data.variable.default_value, null, 2) : (data.variable.default_value ?? ''),
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    const val = this.form.value;
    let parsed: any = val.default_value;
    if (val.type === 'json') {
      try { parsed = val.default_value ? JSON.parse(val.default_value as any) : null; } catch { /* keep string */ }
    }
    this.dialogRef.close({ ...val, default_value: parsed });
  }
}
