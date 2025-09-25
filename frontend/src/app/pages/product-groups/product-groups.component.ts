import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductGroupsService, ProductGroup, ProductGroupStatus, ProductGroupQuery, ProductGroupStats } from '../../services/product-groups.service';
import { ProductGroupDialogComponent } from './product-group-dialog.component';

@Component({
  selector: 'app-product-groups',
  template: `
    <div class="page-container">
      <!-- Header with Stats -->
      <div class="content-header">
        <div class="header-title">
          <h2>Quản lý Nhóm sản phẩm</h2>
          <p class="subtitle">Quản lý và phân loại sản phẩm theo nhóm</p>
        </div>
        <div class="actions-bar">
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon>
            Thêm nhóm mới
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-row" *ngIf="stats">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon total">
              <mat-icon>folder</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.total }}</div>
              <div class="stat-label">Tổng nhóm</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon active">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.active }}</div>
              <div class="stat-label">Đang hoạt động</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon inactive">
              <mat-icon>pause_circle</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.inactive }}</div>
              <div class="stat-label">Tạm dừng</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon products">
              <mat-icon>inventory</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.withProducts }}</div>
              <div class="stat-label">Có sản phẩm</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Search and Filter Section -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Tìm kiếm theo tên hoặc mô tả</mat-label>
              <input matInput [formControl]="searchControl" placeholder="Nhập từ khóa...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Lọc theo trạng thái</mat-label>
              <mat-select [formControl]="statusControl">
                <mat-option value="">Tất cả</mat-option>
                <mat-option value="active">Đang hoạt động</mat-option>
                <mat-option value="inactive">Tạm dừng</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button (click)="clearFilters()" [disabled]="!hasActiveFilters()">
              <mat-icon>clear</mat-icon>
              Xóa bộ lọc
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Data Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="full-width-table">
              
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Tên nhóm</th>
                <td mat-cell *matCellDef="let group">
                  <div class="name-cell">
                    <span class="color-chip" [style.background]="group.color"></span>
                    <span class="group-name">{{ group.name }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Mô tả</th>
                <td mat-cell *matCellDef="let group">
                  <span class="description-text">{{ group.description || 'Chưa có mô tả' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Trạng thái</th>
                <td mat-cell *matCellDef="let group">
                  <mat-chip [class]="'status-' + group.status">
                    <mat-icon *ngIf="group.status === 'active'">check_circle</mat-icon>
                    <mat-icon *ngIf="group.status === 'inactive'">pause_circle</mat-icon>
                    {{ getStatusLabel(group.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Ngày tạo</th>
                <td mat-cell *matCellDef="let group">
                  {{ formatDate(group.createdAt) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="productCount">
                <th mat-header-cell *matHeaderCellDef>Số sản phẩm</th>
                <td mat-cell *matCellDef="let group">
                  <span class="product-count">{{ group.productCount || 0 }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="actions-header">Hành động</th>
                <td mat-cell *matCellDef="let group" class="actions-cell">
                  <button mat-icon-button [matMenuTriggerFor]="actionMenu" class="action-button">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item (click)="viewProducts(group)">
                      <mat-icon>inventory</mat-icon>
                      <span>Xem sản phẩm</span>
                    </button>
                    <button mat-menu-item (click)="openDialog(group)">
                      <mat-icon>edit</mat-icon>
                      <span>Chỉnh sửa</span>
                    </button>
                    <button mat-menu-item (click)="toggleStatus(group)">
                      <mat-icon>{{ group.status === 'active' ? 'pause' : 'play_arrow' }}</mat-icon>
                      <span>{{ group.status === 'active' ? 'Tạm dừng' : 'Kích hoạt' }}</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item (click)="confirmDelete(group)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Xóa</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="data-row"></tr>
            </table>
          </div>

          <!-- Pagination -->
          <mat-paginator 
            [length]="totalItems"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageIndex]="currentPage - 1"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-title h2 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
    }

    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 20px !important;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .stat-icon.total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .stat-icon.active { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; }
    .stat-icon.inactive { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #666; }
    .stat-icon.products { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #666; }

    .stat-number {
      font-size: 24px;
      font-weight: 600;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 300px;
    }

    .table-container {
      overflow-x: auto;
    }

    .full-width-table {
      width: 100%;
    }

    .name-cell {
      display: flex;
      align-items: center;
    }

    .color-chip {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-right: 12px;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    .group-name {
      font-weight: 500;
    }

    .description-text {
      color: #666;
      font-style: italic;
    }

    .status-active {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-inactive {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .product-count {
      font-weight: 500;
      color: #1976d2;
    }

    .actions-header,
    .actions-cell {
      width: 80px;
      text-align: center;
    }

    .action-button {
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .data-row:hover .action-button {
      opacity: 1;
    }

    .delete-action {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .content-header {
        flex-direction: column;
        gap: 16px;
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field {
        min-width: unset;
      }

      .stats-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductGroupsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'description', 'status', 'createdAt', 'productCount', 'actions'];
  dataSource = new MatTableDataSource<ProductGroup>([]);
  
  // Search and Filter
  searchControl = new FormControl('');
  statusControl = new FormControl('');
  private searchSubject = new Subject<string>();
  
  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  
  // Statistics
  stats: ProductGroupStats | null = null;
  
  // Loading state
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private service: ProductGroupsService,
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.currentPage = 1;
      this.loadData();
    });
  }

  ngOnInit() {
    this.loadData();
    this.loadStats();
    this.setupFormSubscriptions();
  }

  ngAfterViewInit() {
    // Note: We're handling pagination manually, so we don't connect mat-paginator directly
  }

  private setupFormSubscriptions() {
    this.searchControl.valueChanges.subscribe(value => {
      this.searchSubject.next(value || '');
    });

    this.statusControl.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
  }

  loadData() {
    this.loading = true;
    
    const query: ProductGroupQuery = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchControl.value) {
      query.search = this.searchControl.value;
    }

    if (this.statusControl.value) {
      query.status = this.statusControl.value as ProductGroupStatus;
    }

    this.service.getAll(query).subscribe({
      next: response => {
        this.dataSource.data = response.data;
        this.totalItems = response.total;
        this.loading = false;
      },
      error: () => {
        this.show('Tải dữ liệu nhóm sản phẩm thất bại!');
        this.loading = false;
      }
    });
  }

  loadStats() {
    this.service.getStats().subscribe({
      next: stats => this.stats = stats,
      error: () => console.error('Failed to load stats')
    });
  }

  // Pagination
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  // Filters
  clearFilters() {
    this.searchControl.setValue('');
    this.statusControl.setValue('');
    this.currentPage = 1;
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchControl.value || this.statusControl.value);
  }

  // Dialog operations
  openDialog(group?: ProductGroup) {
    const dialogRef = this.dialog.open(ProductGroupDialogComponent, {
      width: '500px',
      data: { row: group }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      
      if (group && group._id) {
        this.updateGroup(group._id, result);
      } else {
        this.createGroup(result);
      }
    });
  }

  private createGroup(data: any) {
    this.service.create(data).subscribe({
      next: () => {
        this.show('Tạo nhóm sản phẩm thành công');
        this.loadData();
        this.loadStats();
      },
      error: (error) => {
        const message = error.error?.message || 'Tạo nhóm sản phẩm thất bại!';
        this.show(message);
      }
    });
  }

  private updateGroup(id: string, data: any) {
    this.service.update(id, data).subscribe({
      next: () => {
        this.show('Cập nhật nhóm sản phẩm thành công');
        this.loadData();
        this.loadStats();
      },
      error: (error) => {
        const message = error.error?.message || 'Cập nhật nhóm sản phẩm thất bại!';
        this.show(message);
      }
    });
  }

  // Actions
  viewProducts(group: ProductGroup) {
    if (!group._id) return;
    // TODO: Navigate to products page with group filter
    this.show(`Xem sản phẩm trong nhóm "${group.name}" - Chức năng đang phát triển`);
  }

  toggleStatus(group: ProductGroup) {
    if (!group._id) return;
    
    const newStatus = group.status === ProductGroupStatus.ACTIVE ? 
      ProductGroupStatus.INACTIVE : ProductGroupStatus.ACTIVE;
    
    this.service.update(group._id, { status: newStatus }).subscribe({
      next: () => {
        const action = newStatus === ProductGroupStatus.ACTIVE ? 'kích hoạt' : 'tạm dừng';
        this.show(`${action.charAt(0).toUpperCase() + action.slice(1)} nhóm sản phẩm thành công`);
        this.loadData();
        this.loadStats();
      },
      error: () => this.show('Cập nhật trạng thái thất bại!')
    });
  }

  confirmDelete(group: ProductGroup) {
    if (!group._id) return;
    
    // TODO: Check if group has products first
    const message = `Bạn có chắc chắn muốn xóa nhóm sản phẩm "${group.name}"?\n\nLưu ý: Các sản phẩm trong nhóm này sẽ không bị xóa nhưng có thể mất liên kết nhóm.`;
    
    if (confirm(message)) {
      this.deleteGroup(group._id);
    }
  }

  private deleteGroup(id: string) {
    this.service.delete(id).subscribe({
      next: () => {
        this.show('Xóa nhóm sản phẩm thành công');
        this.loadData();
        this.loadStats();
      },
      error: () => this.show('Xóa nhóm sản phẩm thất bại!')
    });
  }

  // Utility methods
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'inactive': return 'Tạm dừng';
      default: return status;
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private show(msg: string) {
    this.snackBar.open(msg, 'Đóng', { 
      duration: 3000, 
      verticalPosition: 'top',
      horizontalPosition: 'right'
    });
  }
}
