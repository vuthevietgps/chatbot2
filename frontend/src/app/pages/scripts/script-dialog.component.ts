import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormArray, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-script-dialog',
  template: `
    <h2 mat-dialog-title>{{ data?.row ? 'Cập nhật' : 'Thêm mới' }} Script</h2>
    <mat-dialog-content [formGroup]="form" class="dialog-form">
      <div class="row">
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Nhóm kịch bản</mat-label>
          <mat-select formControlName="scriptGroupId" required>
            <mat-option *ngFor="let g of data.scriptGroups" [value]="g._id">{{ g.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.controls.scriptGroupId.invalid">Bắt buộc</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Tên Script</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="form.controls.name.invalid">Bắt buộc</mat-error>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Trigger keywords (mỗi dòng một mục)</mat-label>
          <textarea matInput rows="3" [value]="form.value.trigger?.join('\n')" (input)="onTriggerChange($event)"></textarea>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Response Template</mat-label>
          <textarea matInput rows="4" formControlName="responseTemplate" required></textarea>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Liên kết Sản phẩm</mat-label>
          <mat-select formControlName="linkedProductId">
            <mat-option [value]="null">-- Không --</mat-option>
            <mat-option *ngFor="let p of data.products" [value]="p._id">{{ p.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Liên kết Nhóm SP</mat-label>
          <mat-select formControlName="linkedProductGroupId">
            <mat-option [value]="null">-- Không --</mat-option>
            <mat-option *ngFor="let g of data.productGroups" [value]="g._id">{{ g.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="w-33">
          <mat-label>Ưu tiên</mat-label>
          <input matInput type="number" formControlName="priority">
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-33">
          <mat-label>Trạng thái</mat-label>
          <mat-select formControlName="status">
            <mat-option value="active">active</mat-option>
            <mat-option value="inactive">inactive</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-33">
          <mat-label>Action</mat-label>
          <mat-select formControlName="action">
            <mat-option [value]="null">-- Không --</mat-option>
            <mat-option value="send_image">send_image</mat-option>
            <mat-option value="show_product_list">show_product_list</mat-option>
            <mat-option value="create_order">create_order</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Yêu cầu ngữ cảnh</mat-label>
          <textarea matInput rows="2" formControlName="contextRequirement"></textarea>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-slide-toggle formControlName="aiAssist">Cho phép AI hỗ trợ</mat-slide-toggle>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Hủy</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form .row { display: flex; gap: 12px; margin-bottom: 8px; }
    .w-33 { width: 33.33%; }
    .w-50 { width: 50%; }
    .w-100 { width: 100%; }
  `]
})
export class ScriptDialogComponent {
  form = this.fb.group({
    scriptGroupId: ['', Validators.required],
    name: ['', Validators.required],
    trigger: this.fb.control<string[]>([]),
    responseTemplate: ['', Validators.required],
    linkedProductId: [null as any],
    linkedProductGroupId: [null as any],
    priority: [0],
    status: ['active', Validators.required],
    contextRequirement: [''],
    aiAssist: [false],
    action: [null as any],
  });

  constructor(
    public dialogRef: MatDialogRef<ScriptDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.row) {
      const r = data.row;
      this.form.patchValue({
        scriptGroupId: typeof r.scriptGroupId === 'object' ? r.scriptGroupId?._id : r.scriptGroupId,
        name: r.name,
        trigger: r.trigger || [],
        responseTemplate: r.responseTemplate,
        linkedProductId: r.linkedProductId && typeof r.linkedProductId === 'object' ? r.linkedProductId?._id : (r.linkedProductId || null),
        linkedProductGroupId: r.linkedProductGroupId && typeof r.linkedProductGroupId === 'object' ? r.linkedProductGroupId?._id : (r.linkedProductGroupId || null),
        priority: r.priority ?? 0,
        status: r.status || 'active',
        contextRequirement: r.contextRequirement || '',
        aiAssist: !!r.aiAssist,
        action: r.action || null,
      });
    }
  }

  onTriggerChange(e: Event) {
    const value = (e.target as HTMLTextAreaElement).value || '';
    const arr = value.split('\n').map(s => s.trim()).filter(Boolean);
    this.form.controls.trigger.setValue(arr);
  }

  submit() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }
}
