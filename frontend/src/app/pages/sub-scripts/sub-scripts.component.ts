import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SubScript } from '../../models/sub-script.model';
import { SubScriptsService } from '../../services/sub-scripts.service';
import { ScriptGroupsService } from '../../services/script-groups.service';
import { SubScriptDialogComponent } from './sub-script-dialog/sub-script-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-sub-scripts',
  templateUrl: './sub-scripts.component.html',
  styleUrls: ['./sub-scripts.component.scss']
})
export class SubScriptsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'name',
    'scenario',
    'trigger_keywords',
    'priority',
    'status',
    'created_at',
    'actions'
  ];
  
  dataSource = new MatTableDataSource<SubScript>();
  scenarios: any[] = [];
  selectedScenarioId: string = '';
  loading = false;
  statistics: any = null;

  constructor(
    private subScriptsService: SubScriptsService,
    private scriptGroupsService: ScriptGroupsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSubScripts();
    this.loadScenarios();
    this.loadStatistics();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadSubScripts(): void {
    this.loading = true;
    const query = this.selectedScenarioId ? { scenario_id: this.selectedScenarioId } : {};
    
    this.subScriptsService.getSubScripts(query).subscribe({
      next: (subScripts) => {
        this.dataSource.data = subScripts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sub-scripts:', error);
        this.snackBar.open('Lỗi khi tải danh sách Script con', 'Đóng', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadScenarios(): void {
    this.scriptGroupsService.getAll().subscribe({
      next: (scenarios: any) => {
        this.scenarios = scenarios;
      },
      error: (error: any) => {
        console.error('Error loading scenarios:', error);
      }
    });
  }

  loadStatistics(): void {
    this.subScriptsService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  onScenarioFilter(): void {
    this.loadSubScripts();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SubScriptDialogComponent, {
      width: '800px',
      data: {
        subScript: null,
        mode: 'create'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubScripts();
        this.loadStatistics();
        this.snackBar.open('Tạo Script con thành công', 'Đóng', { duration: 3000 });
      }
    });
  }

  openEditDialog(subScript: SubScript): void {
    const dialogRef = this.dialog.open(SubScriptDialogComponent, {
      width: '800px',
      data: {
        subScript: { ...subScript },
        mode: 'edit'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubScripts();
        this.loadStatistics();
        this.snackBar.open('Cập nhật Script con thành công', 'Đóng', { duration: 3000 });
      }
    });
  }

  toggleStatus(subScript: SubScript): void {
    this.subScriptsService.toggleSubScriptStatus(subScript._id!).subscribe({
      next: (updated) => {
        const index = this.dataSource.data.findIndex(s => s._id === subScript._id);
        if (index !== -1) {
          this.dataSource.data[index] = updated;
          this.dataSource._updateChangeSubscription();
        }
        this.loadStatistics();
        this.snackBar.open(
          `${updated.status === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} Script con thành công`, 
          'Đóng', 
          { duration: 3000 }
        );
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        this.snackBar.open('Lỗi khi thay đổi trạng thái', 'Đóng', { duration: 3000 });
      }
    });
  }

  deleteSubScript(subScript: SubScript): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận xóa',
        message: `Bạn có chắc chắn muốn xóa Script con "${subScript.name}"?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.subScriptsService.deleteSubScript(subScript._id!).subscribe({
          next: () => {
            this.loadSubScripts();
            this.loadStatistics();
            this.snackBar.open('Xóa Script con thành công', 'Đóng', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting sub-script:', error);
            this.snackBar.open('Lỗi khi xóa Script con', 'Đóng', { duration: 3000 });
          }
        });
      }
    });
  }

  getStatusColor(status: string): string {
    return status === 'active' ? 'primary' : 'warn';
  }

  getStatusText(status: string): string {
    return status === 'active' ? 'Hoạt động' : 'Tạm dừng';
  }

  getTriggerKeywordsDisplay(keywords: string[]): string {
    if (!keywords || keywords.length === 0) return 'Chưa có';
    if (keywords.length <= 2) return keywords.join(', ');
    return `${keywords.slice(0, 2).join(', ')} (+${keywords.length - 2})`;
  }
}