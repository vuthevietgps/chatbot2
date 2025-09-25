import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-fanpage-dialog',
  template: `
    <h2 mat-dialog-title>{{ data ? 'Sửa' : 'Thêm mới' }} Fanpage</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="user-form">
        <div class="row">
          <mat-form-field class="full-width">
            <mat-label>Page ID *</mat-label>
            <input matInput formControlName="pageId" required>
            <mat-error *ngIf="form.get('pageId')?.hasError('required')">Bắt buộc</mat-error>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field class="full-width">
            <mat-label>Tên Fanpage *</mat-label>
            <input matInput formControlName="pageName" required>
            <mat-error *ngIf="form.get('pageName')?.hasError('required')">Bắt buộc</mat-error>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field class="full-width">
            <mat-label>Access Token *</mat-label>
            <textarea matInput formControlName="accessToken" rows="3" required></textarea>
            <mat-error *ngIf="form.get('accessToken')?.hasError('required')">Bắt buộc</mat-error>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field>
            <mat-label>Trạng thái *</mat-label>
            <mat-select formControlName="status" required>
              <mat-option value="active">active</mat-option>
              <mat-option value="expired">expired</mat-option>
              <mat-option value="removed">removed</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Kết nối lúc *</mat-label>
            <input matInput type="datetime-local" formControlName="connectedAt" required>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Refresh gần nhất</mat-label>
            <input matInput type="datetime-local" formControlName="lastRefreshed">
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field class="full-width">
            <mat-label>Avatar URL</mat-label>
            <input matInput formControlName="avatarUrl">
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field>
            <mat-label>ConnectedBy (UserId)</mat-label>
            <input matInput formControlName="connectedBy" placeholder="optional user _id">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Default Script Group Id</mat-label>
            <input matInput formControlName="defaultScriptGroupId" placeholder="optional">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Default Product Group Id</mat-label>
            <input matInput formControlName="defaultProductGroupId" placeholder="optional">
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field>
            <mat-label>Subscriber</mat-label>
            <input matInput type="number" formControlName="subscriberCount">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Message quota</mat-label>
            <input matInput type="number" formControlName="messageQuota">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Sent this month</mat-label>
            <input matInput type="number" formControlName="messagesSentThisMonth">
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field>
            <mat-label>Múi giờ</mat-label>
            <input matInput formControlName="timeZone" placeholder="Asia/Ho_Chi_Minh">
          </mat-form-field>

          <mat-slide-toggle formControlName="webhookSubscribed">Đã subscribe webhook</mat-slide-toggle>
          <mat-slide-toggle formControlName="aiEnabled">Bật AI</mat-slide-toggle>
        </div>

        <div class="row">
          <mat-form-field class="full-width">
            <mat-label>Categories (phân tách bằng dấu phẩy)</mat-label>
            <input matInput formControlName="categoriesStr" placeholder="thời trang, mỹ phẩm">
          </mat-form-field>
        </div>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="onSave()">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .row { display: flex; gap: 16px; align-items: center; }
    .full-width { width: 100%; }
    mat-form-field { flex: 1; }
  `]
})
export class FanpageDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FanpageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.fb.group({
      pageId: [data?.pageId || '', [Validators.required]],
      pageName: [data?.pageName || '', [Validators.required]],
      accessToken: [data?.accessToken || '', [Validators.required]],
      status: [data?.status || 'active', [Validators.required]],
      connectedAt: [this.toLocalInput(data?.connectedAt) || this.toLocalInput(new Date().toISOString()), [Validators.required]],
      lastRefreshed: [this.toLocalInput(data?.lastRefreshed)],
      avatarUrl: [data?.avatarUrl || ''],
        connectedBy: [data?.connectedBy || ''],
      subscriberCount: [data?.subscriberCount ?? 0],
      messageQuota: [data?.messageQuota ?? 10000],
      messagesSentThisMonth: [data?.messagesSentThisMonth ?? 0],
      webhookSubscribed: [data?.webhookSubscribed ?? false],
      aiEnabled: [data?.aiEnabled ?? false],
      timeZone: [data?.timeZone || 'Asia/Ho_Chi_Minh'],
        defaultScriptGroupId: [data?.defaultScriptGroupId || ''],
        defaultProductGroupId: [data?.defaultProductGroupId || ''],
      categoriesStr: [(data?.categories || []).join(', ')]
    });
  }

  private toLocalInput(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  onCancel() { this.dialogRef.close(); }
  onSave() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: any = {
      ...v,
      connectedAt: new Date(v.connectedAt).toISOString(),
      lastRefreshed: v.lastRefreshed ? new Date(v.lastRefreshed).toISOString() : undefined,
      categories: (v.categoriesStr as string || '').split(',').map(x => x.trim()).filter(Boolean)
    };
    delete payload.categoriesStr;
    this.dialogRef.close(payload);
  }
}
