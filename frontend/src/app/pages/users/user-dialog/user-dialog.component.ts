import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface UserData {
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'director' | 'manager' | 'employee';
  department?: string;
  position?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-user-dialog',
  template: `
    <h2 mat-dialog-title>{{data ? 'Sửa' : 'Thêm mới'}} User</h2>
    
    <mat-dialog-content class="dialog-content">
      <form [formGroup]="userForm" class="user-form">
        <div class="form-row">
          <mat-form-field class="full-width">
            <mat-label>Họ tên *</mat-label>
            <input matInput formControlName="fullName" required>
            <mat-error *ngIf="userForm.get('fullName')?.hasError('required')">
              Họ tên là bắt buộc
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field class="full-width">
            <mat-label>Email *</mat-label>
            <input matInput formControlName="email" type="email" required>
            <mat-error *ngIf="userForm.get('email')?.hasError('required')">
              Email là bắt buộc
            </mat-error>
            <mat-error *ngIf="userForm.get('email')?.hasError('email')">
              Email không hợp lệ
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field class="full-width">
            <mat-label>Số điện thoại *</mat-label>
            <input matInput formControlName="phone" required>
            <mat-error *ngIf="userForm.get('phone')?.hasError('required')">
              Số điện thoại là bắt buộc
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row" *ngIf="!data">
          <mat-form-field class="full-width">
            <mat-label>Mật khẩu *</mat-label>
            <input matInput formControlName="password" type="password" required>
            <mat-error *ngIf="userForm.get('password')?.hasError('required')">
              Mật khẩu là bắt buộc
            </mat-error>
            <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">
              Mật khẩu phải có ít nhất 6 ký tự
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field class="full-width">
            <mat-label>Vai trò *</mat-label>
            <mat-select formControlName="role" required>
              <mat-option value="employee">Nhân viên</mat-option>
              <mat-option value="manager">Quản lý</mat-option>
              <mat-option value="director">Giám đốc</mat-option>
            </mat-select>
            <mat-error *ngIf="userForm.get('role')?.hasError('required')">
              Vai trò là bắt buộc
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field class="half-width">
            <mat-label>Phòng ban</mat-label>
            <input matInput formControlName="department">
          </mat-form-field>

          <mat-form-field class="half-width">
            <mat-label>Chức vụ</mat-label>
            <input matInput formControlName="position">
          </mat-form-field>
        </div>

        <div class="form-row" *ngIf="data">
          <mat-slide-toggle formControlName="isActive" color="primary">
            {{userForm.get('isActive')?.value ? 'Đang hoạt động' : 'Ngừng hoạt động'}}
          </mat-slide-toggle>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button color="primary" 
              [disabled]="!userForm.valid || loading"
              (click)="onSubmit()">
        <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
        {{loading ? 'Đang xử lý...' : (data ? 'Cập nhật' : 'Tạo mới')}}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      max-width: 500px;
    }

    .user-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      width: 48%;
    }

    mat-dialog-actions {
      padding: 20px 0 0 0;
    }

    .mat-mdc-dialog-actions {
      justify-content: flex-end;
      gap: 8px;
    }
  `]
})
export class UserDialogComponent implements OnInit {
  userForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserData | null
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit() {
    if (this.data) {
      this.userForm.patchValue(this.data);
    }
  }

  createForm(): FormGroup {
    const formConfig: any = {
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      role: ['employee', [Validators.required]],
      department: [''],
      position: [''],
      isActive: [true]
    };

    // Add password field only for new users
    if (!this.data) {
      formConfig.password = ['', [Validators.required, Validators.minLength(6)]];
    }

    return this.fb.group(formConfig);
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.loading = true;
      
      // Simulate API call
      setTimeout(() => {
        const formValue = this.userForm.value;
        
        if (this.data) {
          // Update existing user
          const result = { ...this.data, ...formValue };
          this.dialogRef.close(result);
        } else {
          // Create new user
          this.dialogRef.close(formValue);
        }
        
        this.loading = false;
      }, 1000);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}