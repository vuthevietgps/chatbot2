import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatchMode, TriggerType } from '../../services/scenarios.service';

@Component({
  selector: 'app-trigger-dialog',
  template: `
    <h2 mat-dialog-title>{{ data?.trigger ? 'Cập nhật' : 'Thêm' }} Trigger</h2>
    <mat-dialog-content [formGroup]="form" class="dialog-form">
      <div class="row">
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Loại trigger</mat-label>
          <mat-select formControlName="type" required (selectionChange)="onTypeChange()">
            <mat-option value="keyword">Từ khóa</mat-option>
            <mat-option value="event">Sự kiện</mat-option>
            <mat-option value="time">Thời gian</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-50" *ngIf="form.value.type === 'keyword'">
          <mat-label>Cách so khớp</mat-label>
          <mat-select formControlName="match_mode" required>
            <mat-option value="contains">Chứa</mat-option>
            <mat-option value="exact">Chính xác</mat-option>
            <mat-option value="regex">Regex</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Keyword value -->
      <div class="row" *ngIf="form.value.type === 'keyword'">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Giá trị</mat-label>
          <input matInput formControlName="value" placeholder="ví dụ: giá vòng tay" required>
          <mat-error *ngIf="form.controls.value.invalid">Bắt buộc</mat-error>
        </mat-form-field>
      </div>

      <!-- Event select -->
      <div class="row" *ngIf="form.value.type === 'event'" [formGroup]="eventGroup">
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Sự kiện</mat-label>
          <mat-select formControlName="event" required (selectionChange)="onEventChange()">
            <mat-option value="new_customer">Khách hàng mới</mat-option>
            <mat-option value="no_reply">Không trả lời sau X phút</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-50" *ngIf="eventGroup.value.event === 'no_reply'">
          <mat-label>Số phút</mat-label>
          <input matInput type="number" min="1" formControlName="minutes" placeholder="ví dụ: 10">
        </mat-form-field>
      </div>

      <!-- Time input -->
      <div class="row" *ngIf="form.value.type === 'time'" [formGroup]="timeGroup">
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Thời gian</mat-label>
          <input matInput type="number" min="1" formControlName="amount" placeholder="ví dụ: 5" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Đơn vị</mat-label>
          <mat-select formControlName="unit" required>
            <mat-option value="m">Phút</mat-option>
            <mat-option value="h">Giờ</mat-option>
            <mat-option value="d">Ngày</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-slide-toggle formControlName="is_active">Bật trigger</mat-slide-toggle>
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
export class TriggerDialogComponent {
  form = this.fb.group({
    type: ['keyword' as TriggerType, Validators.required],
    match_mode: ['contains' as MatchMode, Validators.required],
    value: [''],
    is_active: [true],
  });
  eventGroup = this.fb.group({ event: ['new_customer', Validators.required], minutes: [10] });
  timeGroup = this.fb.group({ amount: [5, Validators.required], unit: ['m', Validators.required] });

  constructor(
    public dialogRef: MatDialogRef<TriggerDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    if (data?.trigger) {
      this.form.patchValue({
        type: data.trigger.type,
        match_mode: data.trigger.match_mode,
        value: data.trigger.value,
        is_active: data.trigger.is_active,
      });
      if (data.trigger.type === 'event') {
        // naive backfill for event value formats
        const v: string = data.trigger.value || '';
        if (v.startsWith('no_reply')) {
          const m = /no_reply:(\d+)m/.exec(v);
          this.eventGroup.patchValue({ event: 'no_reply', minutes: m ? +m[1] : 10 });
        } else {
          this.eventGroup.patchValue({ event: 'new_customer', minutes: 10 });
        }
      }
      if (data.trigger.type === 'time') {
        const v: string = data.trigger.value || '';
        const m = /(\d+)([mhd])/.exec(v);
        if (m) this.timeGroup.patchValue({ amount: +m[1], unit: m[2] });
      }
    }
    this.onTypeChange();
  }

  onTypeChange() {
    const t = this.form.value.type;
    if (t === 'keyword') {
      this.form.controls.match_mode.enable();
      this.form.controls.value.setValidators([Validators.required]);
      this.form.controls.value.updateValueAndValidity();
    } else {
      this.form.controls.match_mode.setValue('exact');
      this.form.controls.match_mode.disable();
      this.form.controls.value.clearValidators();
      this.form.controls.value.updateValueAndValidity();
    }
  }

  onEventChange() {
    // ensure minutes required only for no_reply
    if (this.eventGroup.value.event === 'no_reply') {
      this.eventGroup.controls.minutes.setValidators([Validators.required]);
    } else {
      this.eventGroup.controls.minutes.clearValidators();
    }
    this.eventGroup.controls.minutes.updateValueAndValidity();
  }

  submit() {
    if (this.form.invalid) return;
    const val = this.form.value;
    const type = val.type as TriggerType;
    let payload: any = {
      type,
      match_mode: val.match_mode as MatchMode,
      value: val.value,
      is_active: !!val.is_active,
    };
    if (type === 'event') {
      const e = this.eventGroup.value;
      payload.match_mode = 'exact';
      payload.value = e.event === 'no_reply' ? `no_reply:${e.minutes}m` : 'new_customer';
    } else if (type === 'time') {
      const t = this.timeGroup.value;
      payload.match_mode = 'exact';
      payload.value = `${t.amount}${t.unit}`; // e.g., 5m, 2h, 1d
    }
    this.dialogRef.close(payload);
  }
}
