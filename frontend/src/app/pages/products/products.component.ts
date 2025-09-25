import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ProductsService, Product, ProductStatus, ProductStatistics } from '../../services/products.service';
import { ProductGroupsService, ProductGroup } from '../../services/product-groups.service';
import { ProductDialogComponent } from './product-dialog.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-products',
  template: `
    <div class="products-container">
      <div class="content-header">
        <h2>Quản lý Sản phẩm</h2>
        <div class="actions-bar">
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon>
            Thêm mới
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-container">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number">{{statistics.total}}</div>
              <div class="stat-label">Tổng sản phẩm</div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number active">{{statistics.active}}</div>
              <div class="stat-label">Đang bán</div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number inactive">{{statistics.inactive}}</div>
              <div class="stat-label">Tạm ẩn</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-number out-of-stock">{{statistics.outOfStock}}</div>
              <div class="stat-label">Hết hàng</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="table-card">
        <mat-card-content>
          <!-- Search and Filters -->
          <div class="table-header">
            <mat-form-field class="search-field">
              <mat-label>Tìm kiếm</mat-label>
              <input matInput placeholder="Tìm theo tên hoặc SKU..." 
                     [value]="searchTerm" 
                     (input)="onSearchChange($event)">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            
            <mat-form-field class="filter-field">
              <mat-label>Nhóm sản phẩm</mat-label>
              <mat-select [(value)]="selectedGroupId" (selectionChange)="onFilterChange()">
                <mat-option value="">Tất cả</mat-option>
                <mat-option *ngFor="let group of groups" [value]="group._id">
                  {{group.name}}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field class="filter-field">
              <mat-label>Trạng thái</mat-label>
              <mat-select [(value)]="selectedStatus" (selectionChange)="onFilterChange()">
                <mat-option value="">Tất cả</mat-option>
                <mat-option value="active">Đang bán</mat-option>
                <mat-option value="inactive">Tạm ẩn</mat-option>
                <mat-option value="out_of_stock">Hết hàng</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <table mat-table [dataSource]="dataSource" matSort>
            <!-- Image Column -->
            <ng-container matColumnDef="image">
              <th mat-header-cell *matHeaderCellDef>Ảnh</th>
              <td mat-cell *matCellDef="let p">
                <img *ngIf="p.images && p.images.length > 0" 
                     [src]="p.images[0]" 
                     alt="{{p.name}}" 
                     class="product-thumbnail"
                     (error)="onImageError($event)">
                <div *ngIf="!p.images || p.images.length === 0" class="no-image">
                  <mat-icon>image</mat-icon>
                </div>
              </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Tên</th>
              <td mat-cell *matCellDef="let p">
                <div class="product-name">{{p.name}}</div>
                <div class="product-sku">SKU: {{p.sku}}</div>
              </td>
            </ng-container>

            <!-- Group Column -->
            <ng-container matColumnDef="group">
              <th mat-header-cell *matHeaderCellDef>Nhóm</th>
              <td mat-cell *matCellDef="let p">
                <span class="group-chip" [style.background-color]="getGroupColor(p.groupId)">
                  {{renderGroup(p.groupId)}}
                </span>
              </td>
            </ng-container>

            <!-- Price Column -->
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Giá</th>
              <td mat-cell *matCellDef="let p">
                <div class="price-container">
                  <div class="current-price">{{p.price | number}} {{p.currency}}</div>
                  <div *ngIf="p.salePrice" class="sale-price">{{p.salePrice | number}} {{p.currency}}</div>
                </div>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
              <td mat-cell *matCellDef="let p">
                <span [class]="'status-' + p.status">{{getStatusText(p.status)}}</span>
              </td>
            </ng-container>

            <!-- Stock Column -->
            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>Tồn kho</th>
              <td mat-cell *matCellDef="let p">
                <span [class]="p.stock === 0 ? 'stock-zero' : 'stock-normal'">
                  {{p.stock ?? 0}}
                </span>
              </td>
            </ng-container>

            <!-- Created Date Column -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Ngày tạo</th>
              <td mat-cell *matCellDef="let p">{{p.createdAt | date:'dd/MM/yyyy'}}</td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Hành động</th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="openDialog(p)">
                    <mat-icon>edit</mat-icon>
                    <span>Sửa</span>
                  </button>
                  <button mat-menu-item (click)="toggleStatus(p)">
                    <mat-icon>{{p.status === 'active' ? 'visibility_off' : 'visibility'}}</mat-icon>
                    <span>{{p.status === 'active' ? 'Ẩn' : 'Hiện'}}</span>
                  </button>
                  <button mat-menu-item (click)="delete(p)" class="delete-action">
                    <mat-icon>delete</mat-icon>
                    <span>Xóa</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator 
            [length]="totalItems"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 20, 50]"
            [pageIndex]="currentPage - 1"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .products-container {
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

    .stat-number.active { color: #4caf50; }
    .stat-number.inactive { color: #ff9800; }
    .stat-number.out-of-stock { color: #f44336; }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    .table-header {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
    }

    .filter-field {
      min-width: 150px;
    }

    .product-thumbnail {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 4px;
    }

    .no-image {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 4px;
      color: #999;
    }

    .product-name {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .product-sku {
      font-size: 12px;
      color: #666;
    }

    .group-chip {
      padding: 4px 8px;
      border-radius: 12px;
      color: white;
      font-size: 12px;
      font-weight: 500;
    }

    .price-container {
      display: flex;
      flex-direction: column;
    }

    .current-price {
      font-weight: 500;
    }

    .sale-price {
      color: #f44336;
      font-size: 12px;
      font-weight: 500;
    }

    .status-active {
      color: #4caf50;
      font-weight: 500;
    }

    .status-inactive {
      color: #ff9800;
      font-weight: 500;
    }

    .status-out_of_stock {
      color: #f44336;
      font-weight: 500;
    }

    .stock-zero {
      color: #f44336;
      font-weight: 500;
    }

    .stock-normal {
      color: #4caf50;
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
export class ProductsComponent implements OnInit {
  displayedColumns: string[] = ['image', 'name', 'group', 'price', 'status', 'stock', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Product>([]);
  groups: ProductGroup[] = [];
  statistics: ProductStatistics = { total: 0, active: 0, inactive: 0, outOfStock: 0 };

  // Search and filter properties
  searchTerm = '';
  selectedGroupId = '';
  selectedStatus: ProductStatus | '' = '';
  private searchSubject = new Subject<string>();

  // Pagination properties
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private service: ProductsService,
    private groupsService: ProductGroupsService,
  ) {
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadProducts();
    });
  }

  ngOnInit() { 
    this.loadGroups();
    this.loadProducts();
    this.loadStatistics();
  }

  ngAfterViewInit() { 
    // Disable default paginator since we handle pagination manually
    this.dataSource.paginator = null; 
    this.dataSource.sort = this.sort; 
  }

  loadGroups() {
    this.groupsService.getAllSimple().subscribe({ 
      next: groups => this.groups = groups,
      error: () => this.show('Tải danh sách nhóm sản phẩm thất bại!')
    });
  }

  loadProducts() {
    const query = {
      search: this.searchTerm || undefined,
      groupId: this.selectedGroupId || undefined,
      status: this.selectedStatus || undefined,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.service.getAll(query).subscribe({
      next: response => {
        this.dataSource.data = response.data;
        this.totalItems = response.total;
      },
      error: () => this.show('Tải danh sách sản phẩm thất bại!'),
    });
  }

  loadStatistics() {
    this.service.getStatistics().subscribe({
      next: stats => this.statistics = stats,
      error: () => {} // Silent fail for statistics
    });
  }

  // Search and filter handlers
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadProducts();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  // Utility methods
  renderGroup(id: any): string {
    if (id && typeof id === 'object' && 'name' in id) return id.name as string;
    const found = this.groups.find(g => g._id === id);
    return found ? found.name : '';
  }

  getGroupColor(id: any): string {
    if (id && typeof id === 'object' && 'color' in id) return id.color as string;
    const found = this.groups.find(g => g._id === id);
    return found ? found.color : '#666';
  }

  getStatusText(status: ProductStatus): string {
    const statusMap = {
      'active': 'Đang bán',
      'inactive': 'Tạm ẩn',
      'out_of_stock': 'Hết hàng'
    };
    return statusMap[status] || status;
  }

  // CRUD operations
  openDialog(row?: Product) {
    const dialogRef = this.dialog.open(ProductDialogComponent, { 
      width: '800px', 
      maxHeight: '90vh',
      data: { row, groups: this.groups } 
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      
      if (row && row._id) {
        this.updateProduct(row._id, result);
      } else {
        this.createProduct(result);
      }
    });
  }

  createProduct(productData: Partial<Product>) {
    this.service.create(productData).subscribe({
      next: () => {
        this.loadProducts();
        this.loadStatistics();
        this.show('Tạo sản phẩm thành công!');
      },
      error: (error) => {
        const message = error.error?.message || 'Tạo sản phẩm thất bại!';
        this.show(message);
      }
    });
  }

  updateProduct(id: string, productData: Partial<Product>) {
    this.service.update(id, productData).subscribe({
      next: () => {
        this.loadProducts();
        this.loadStatistics();
        this.show('Cập nhật sản phẩm thành công!');
      },
      error: (error) => {
        const message = error.error?.message || 'Cập nhật sản phẩm thất bại!';
        this.show(message);
      }
    });
  }

  toggleStatus(product: Product) {
    if (!product._id) return;
    
    this.service.toggleStatus(product._id).subscribe({
      next: () => {
        this.loadProducts();
        this.loadStatistics();
        this.show('Đổi trạng thái thành công!');
      },
      error: () => this.show('Đổi trạng thái thất bại!')
    });
  }

  delete(product: Product) {
    if (!product._id) return;
    
    const confirmed = confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?\n\nSản phẩm sẽ được ẩn khỏi danh sách nhưng không bị xóa vĩnh viễn.`);
    if (!confirmed) return;
    
    this.service.delete(product._id).subscribe({
      next: () => {
        this.loadProducts();
        this.loadStatistics();
        this.show('Xóa sản phẩm thành công!');
      },
      error: () => this.show('Xóa sản phẩm thất bại!')
    });
  }

  private show(msg: string) { 
    this.snackBar.open(msg, 'Đóng', { 
      duration: 3000, 
      verticalPosition: 'top' 
    }); 
  }
}
