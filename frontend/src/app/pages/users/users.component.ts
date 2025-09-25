import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { UsersService } from '../../services/users.service';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'director' | 'manager' | 'employee';
  isActive: boolean;
  department?: string;
  position?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-users',
  template: `
    <div class="users-container">
      <div class="content-header">
        <h2>Quản lý Users</h2>
        <div class="actions-bar">
          <button mat-raised-button color="primary" (click)="openUserDialog()">
            <mat-icon>person_add</mat-icon>
            Thêm mới User
          </button>
        </div>
      </div>
      
      <!-- Statistics Cards -->
      <div class="stats-container">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number">{{totalUsers}}</div>
              <div class="stat-label">Tổng Users</div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number active">{{activeUsers}}</div>
              <div class="stat-label">Users Active</div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number inactive">{{inactiveUsers}}</div>
              <div class="stat-label">Users Inactive</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Users Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-header">
            <mat-form-field class="search-field">
              <mat-label>Tìm kiếm</mat-label>
              <input matInput (keyup)="applyFilter($event)" placeholder="Tìm theo tên, email...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            
            <mat-form-field class="role-filter">
              <mat-label>Lọc theo vai trò</mat-label>
              <mat-select (selectionChange)="filterByRole($event.value)">
                <mat-option value="">Tất cả</mat-option>
                <mat-option value="director">Giám đốc</mat-option>
                <mat-option value="manager">Quản lý</mat-option>
                <mat-option value="employee">Nhân viên</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <table mat-table [dataSource]="dataSource" matSort class="users-table">
            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Họ tên</th>
              <td mat-cell *matCellDef="let user">{{user.fullName}}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
              <td mat-cell *matCellDef="let user">{{user.email}}</td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Điện thoại</th>
              <td mat-cell *matCellDef="let user">{{user.phone}}</td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Vai trò</th>
              <td mat-cell *matCellDef="let user">
                <span [class]="'role-' + user.role">
                  {{getRoleText(user.role)}}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="department">
              <th mat-header-cell *matHeaderCellDef>Phòng ban</th>
              <td mat-cell *matCellDef="let user">{{user.department || '-'}}</td>
            </ng-container>

            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
              <td mat-cell *matCellDef="let user">
                <span [class]="user.isActive ? 'status-active' : 'status-inactive'">
                  {{user.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Thao tác</th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #actionMenu="matMenu">
                  <button mat-menu-item (click)="editUser(user)">
                    <mat-icon>edit</mat-icon>
                    <span>Sửa</span>
                  </button>
                  <button mat-menu-item (click)="toggleUserStatus(user)">
                    <mat-icon>{{user.isActive ? 'block' : 'check_circle'}}</mat-icon>
                    <span>{{user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}}</span>
                  </button>
                  <button mat-menu-item (click)="deleteUser(user)" class="delete-action">
                    <mat-icon>delete</mat-icon>
                    <span>Xóa</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 20px;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      text-align: center;
    }

    .stat-content {
      padding: 16px;
    }

    .stat-number {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .stat-number.active {
      color: #4caf50;
    }

    .stat-number.inactive {
      color: #f44336;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    .table-card {
      margin-top: 16px;
    }

    .table-header {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .search-field {
      flex: 1;
    }

    .role-filter {
      min-width: 150px;
    }

    .users-table {
      width: 100%;
    }

    .role-director {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .role-manager {
      background: #fff3e0;
      color: #f57c00;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .role-employee {
      background: #e8f5e8;
      color: #388e3c;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-active {
      color: #4caf50;
      font-weight: 500;
    }

    .status-inactive {
      color: #f44336;
      font-weight: 500;
    }

    .delete-action {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .content-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .table-header {
        flex-direction: column;
      }
    }
  `]
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['fullName', 'email', 'phone', 'role', 'department', 'isActive', 'actions'];
  dataSource = new MatTableDataSource<User>();
  
  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadStatistics();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers() {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        // Backend trả createdAt dạng string; ép sang Date nếu cần hiển thị
        this.dataSource.data = users.map(u => ({ ...u, createdAt: new Date(u.createdAt) }));
        this.updateStats();
      },
      error: () => this.showMessage('Tải danh sách user thất bại!')
    });
  }

  updateStats() {
    // fallback local stats nếu API thống kê chưa kịp trả về
    this.totalUsers = this.dataSource.data.length;
    this.activeUsers = this.dataSource.data.filter(u => u.isActive).length;
    this.inactiveUsers = this.totalUsers - this.activeUsers;
  }

  private loadStatistics() {
    this.usersService.getStatistics().subscribe({
      next: (stats) => {
        this.totalUsers = stats.total;
        this.activeUsers = stats.active;
        this.inactiveUsers = stats.inactive;
      },
      error: () => {
        // im lặng, UI vẫn có fallback từ updateStats()
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByRole(role: string) {
    if (!role) {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = role;
      this.dataSource.filterPredicate = (data: User, filter: string) => {
        return data.role === filter;
      };
    }
  }

  openUserDialog(user?: User) {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: user || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (user) {
          this.updateUser(result);
        } else {
          this.createUser(result);
        }
      }
    });
  }

  editUser(user: User) {
    this.openUserDialog(user);
  }

  createUser(userData: any) {
    this.usersService.createUser(userData).subscribe({
      next: (created) => {
        this.dataSource.data = [...this.dataSource.data, { ...created, createdAt: new Date(created.createdAt) }];
        this.updateStats();
        this.showMessage('Tạo user thành công!');
      },
      error: () => this.showMessage('Tạo user thất bại!')
    });
  }

  updateUser(userData: any) {
    this.usersService.updateUser(userData._id, userData).subscribe({
      next: (updated) => {
        const index = this.dataSource.data.findIndex(u => u._id === updated._id);
        if (index !== -1) {
          this.dataSource.data[index] = { ...this.dataSource.data[index], ...updated, createdAt: new Date(updated.createdAt) };
          this.dataSource.data = [...this.dataSource.data];
          this.updateStats();
          this.showMessage('Cập nhật user thành công!');
        }
      },
      error: () => this.showMessage('Cập nhật user thất bại!')
    });
  }

  toggleUserStatus(user: User) {
    this.usersService.toggleStatus(user._id).subscribe({
      next: (updated) => {
        const index = this.dataSource.data.findIndex(u => u._id === updated._id);
        if (index !== -1) {
          this.dataSource.data[index] = { ...this.dataSource.data[index], ...updated };
          this.dataSource.data = [...this.dataSource.data];
          this.updateStats();
          this.showMessage((updated.isActive ? 'Kích hoạt' : 'Vô hiệu hóa') + ' user thành công!');
        }
      },
      error: () => this.showMessage('Đổi trạng thái thất bại!')
    });
  }

  deleteUser(user: User) {
    if (confirm('Bạn có chắc muốn xóa user "' + user.fullName + '"?')) {
      this.usersService.deleteUser(user._id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(u => u._id !== user._id);
          this.updateStats();
          this.showMessage('Xóa user thành công!');
        },
        error: () => this.showMessage('Xóa user thất bại!')
      });
    }
  }

  getRoleText(role: string): string {
    const roles = {
      'director': 'Giám đốc',
      'manager': 'Quản lý', 
      'employee': 'Nhân viên'
    };
    return roles[role as keyof typeof roles] || role;
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      verticalPosition: 'top'
    });
  }
}