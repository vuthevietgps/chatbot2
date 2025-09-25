import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  CustomersService, 
  Customer, 
  CustomerQuery, 
  CustomerResponse, 
  CustomerStats, 
  CustomerStatus 
} from '../../services/customers.service';
import { FanpagesService } from '../../services/fanpages.service';
import { CustomerDialogComponent } from './customer-dialog.component';
import { CustomerDetailComponent } from './customer-detail.component';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  customers: Customer[] = [];
  stats: CustomerStats = {
    total: 0,
    new: 0,
    potential: 0,
    vip: 0,
    inactive: 0,
    blocked: 0
  };
  fanpages: any[] = [];
  availableTags: string[] = [];
  
  // UI state
  loading = false;
  searchTerm = '';
  selectedStatus: CustomerStatus | '' = '';
  selectedTag = '';
  selectedFanpage = '';
  includeDeleted = false;
  
  // Pagination
  totalCustomers = 0;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Search debouncing
  private searchSubject = new Subject<string>();
  
  displayedColumns = ['name', 'phone', 'email', 'fanpage', 'tags', 'status', 'lastMessageAt', 'createdAt', 'actions'];
  customerStatuses = Object.values(CustomerStatus);

  constructor(
    private customersService: CustomersService,
    private fanpagesService: FanpagesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.loadCustomers();
    });
  }

  ngOnInit() {
    this.loadCustomers();
    this.loadStats();
    this.loadFanpages();
    this.loadTags();
  }

  onSearch(searchTerm: string) {
    this.searchSubject.next(searchTerm);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadCustomers();
  }

  onPageChange(event: any) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    
    const query: CustomerQuery = {
      page: this.currentPage,
      limit: this.pageSize,
      includeDeleted: this.includeDeleted
    };
    
    if (this.searchTerm) query.search = this.searchTerm;
    if (this.selectedStatus) query.status = this.selectedStatus as CustomerStatus;
    if (this.selectedTag) query.tag = this.selectedTag;
    if (this.selectedFanpage) query.fanpageId = this.selectedFanpage;
    
    this.customersService.getCustomers(query).subscribe({
      next: (response: CustomerResponse) => {
        this.customers = response.customers;
        this.totalCustomers = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.snackBar.open('Lỗi khi tải danh sách khách hàng', 'Đóng', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadStats() {
    this.customersService.getStatistics().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  loadFanpages() {
            this.fanpagesService.getAll().subscribe({
      next: (response) => {
        this.fanpages = response;
      },
      error: (error) => {
        console.error('Error loading fanpages:', error);
      }
    });
  }

  loadTags() {
    this.customersService.getTags().subscribe({
      next: (tags) => {
        this.availableTags = tags;
      },
      error: (error) => {
        console.error('Error loading tags:', error);
      }
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '600px',
      data: { fanpages: this.fanpages, availableTags: this.availableTags }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCustomers();
        this.loadStats();
        this.loadTags();
        this.snackBar.open('Khách hàng đã được tạo thành công', 'Đóng', { duration: 3000 });
      }
    });
  }

  openEditDialog(customer: Customer) {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '600px',
      data: { 
        customer, 
        fanpages: this.fanpages, 
        availableTags: this.availableTags 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCustomers();
        this.loadStats();
        this.loadTags();
        this.snackBar.open('Khách hàng đã được cập nhật thành công', 'Đóng', { duration: 3000 });
      }
    });
  }

  openDetailDialog(customer: Customer) {
    this.dialog.open(CustomerDetailComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { customer }
    });
  }

  deleteCustomer(customer: Customer) {
    if (confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.name}"?`)) {
      this.customersService.deleteCustomer(customer._id).subscribe({
        next: () => {
          this.loadCustomers();
          this.loadStats();
          this.snackBar.open('Khách hàng đã được xóa thành công', 'Đóng', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.snackBar.open('Lỗi khi xóa khách hàng', 'Đóng', { duration: 3000 });
        }
      });
    }
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedTag = '';
    this.selectedFanpage = '';
    this.includeDeleted = false;
    this.currentPage = 1;
    this.loadCustomers();
  }

  getStatusColor(status: CustomerStatus): string {
    const colors = {
      [CustomerStatus.NEW]: 'primary',
      [CustomerStatus.POTENTIAL]: 'accent',
      [CustomerStatus.VIP]: 'warn',
      [CustomerStatus.INACTIVE]: 'basic',
      [CustomerStatus.BLOCKED]: 'basic'
    };
    return colors[status] || 'basic';
  }

  getStatusText(status: CustomerStatus): string {
    const texts = {
      [CustomerStatus.NEW]: 'Mới',
      [CustomerStatus.POTENTIAL]: 'Tiềm năng',
      [CustomerStatus.VIP]: 'VIP',
      [CustomerStatus.INACTIVE]: 'Không hoạt động',
      [CustomerStatus.BLOCKED]: 'Bị chặn'
    };
    return texts[status] || status;
  }

  getFanpageName(fanpageId: string | any): string {
    if (!fanpageId) return 'Không có';
    
    // If fanpageId is populated object from backend
    if (typeof fanpageId === 'object' && fanpageId.pageName) {
      return fanpageId.pageName;
    }
    
    // If fanpageId is string, find in fanpages array
    if (typeof fanpageId === 'string') {
      const fanpage = this.fanpages.find(f => f._id === fanpageId);
      return fanpage ? fanpage.pageName : 'Không xác định';
    }
    
    return 'Không xác định';
  }
}