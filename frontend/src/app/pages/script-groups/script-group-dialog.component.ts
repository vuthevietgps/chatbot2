import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-script-group-dialog',
  template: `
    <h2 mat-dialog-title>{{ data?.row ? 'Cập nhật' : 'Thêm mới' }} nhóm kịch bản</h2>
    <mat-dialog-content [formGroup]="form" class="dialog-form">
      <div class="row">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Tên nhóm</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="form.controls.name.invalid">Bắt buộc</mat-error>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Mô tả</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Fanpage</mat-label>
          <mat-select formControlName="pageId" required>
            <mat-option *ngFor="let p of data.pages" [value]="p._id">{{ p.pageName }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.controls.pageId.invalid">Bắt buộc</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Nhóm sản phẩm</mat-label>
          <mat-select formControlName="productGroupId" required>
            <mat-option *ngFor="let g of data.groups" [value]="g._id">{{ g.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.controls.productGroupId.invalid">Bắt buộc</mat-error>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Trạng thái</mat-label>
          <mat-select formControlName="status">
            <mat-option value="active">active</mat-option>
            <mat-option value="inactive">inactive</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Ưu tiên</mat-label>
          <input matInput type="number" formControlName="priority">
        </mat-form-field>
      </div>

      <div class="row">
        <mat-slide-toggle formControlName="aiEnabled">Bật AI</mat-slide-toggle>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <span class="left-actions" *ngIf="data?.row?._id">
        <button mat-stroked-button color="primary" (click)="openDetails()">
          <mat-icon>visibility</mat-icon>
          Chi tiết kịch bản
        </button>
      </span>
      <span class="spacer"></span>
      <button mat-button (click)="dialogRef.close()">Hủy</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form .row { display: flex; gap: 12px; }
    .w-50 { width: 50%; }
    .w-100 { width: 100%; }
    .left-actions { margin-right: auto; }
    .spacer { flex: 1 1 auto; }
  `]
})
export class ScriptGroupDialogComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    pageId: ['', Validators.required],
    productGroupId: ['', Validators.required],
    status: ['active', Validators.required],
    priority: [0],
    aiEnabled: [false],
  });

  constructor(
    public dialogRef: MatDialogRef<ScriptGroupDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
  ) {
    if (data?.row) {
      const r = data.row;
      this.form.patchValue({
        name: r.name,
        description: r.description || '',
        pageId: typeof r.pageId === 'object' ? r.pageId?._id : r.pageId,
        productGroupId: typeof r.productGroupId === 'object' ? r.productGroupId?._id : r.productGroupId,
        status: r.status || 'active',
        priority: r.priority ?? 0,
        aiEnabled: !!r.aiEnabled,
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }

  openDetails() {
    if (!this.data?.row?._id) return;
    const name = this.form.get('name')?.value || this.data.row.name;
    this.dialogRef.close();
    this.router.navigate(['/scenarios', this.data.row._id], { state: { name, from: '/chatscripts' } });
  }
}
