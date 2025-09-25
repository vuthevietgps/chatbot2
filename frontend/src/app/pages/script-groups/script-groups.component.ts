import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ScriptGroup, ScriptGroupsService } from '../../services/script-groups.service';
import { FanpagesService, Fanpage } from '../../services/fanpages.service';
import { ProductGroupsService, ProductGroup } from '../../services/product-groups.service';
import { ScriptGroupDialogComponent } from './script-group-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-script-groups',
  template: `
  <div class="users-container">
    <div class="content-header">
      <h2>Nhóm kịch bản</h2>
      <div class="actions-bar">
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          Thêm mới
        </button>
      </div>
    </div>

    <mat-card class="table-card">
      <mat-card-content>
        <table mat-table [dataSource]="dataSource" matSort>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Tên</th>
            <td mat-cell *matCellDef="let r">
              <a class="name-link" (click)="openDetails(r)" title="Chi tiết kịch bản">{{ r.name }}</a>
            </td>
          </ng-container>
          <ng-container matColumnDef="page">
            <th mat-header-cell *matHeaderCellDef>Fanpage</th>
            <td mat-cell *matCellDef="let r">{{ renderPage(r.pageId) }}</td>
          </ng-container>
          <ng-container matColumnDef="group">
            <th mat-header-cell *matHeaderCellDef>Nhóm SP</th>
            <td mat-cell *matCellDef="let r">{{ renderGroup(r.productGroupId) }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
            <td mat-cell *matCellDef="let r">{{ r.status }}</td>
          </ng-container>
          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef>Ưu tiên</th>
            <td mat-cell *matCellDef="let r">{{ r.priority ?? 0 }}</td>
          </ng-container>
          <ng-container matColumnDef="aiEnabled">
            <th mat-header-cell *matHeaderCellDef>AI</th>
            <td mat-cell *matCellDef="let r">
              <mat-icon [color]="r.aiEnabled ? 'primary' : undefined">{{ r.aiEnabled ? 'check_circle' : 'cancel' }}</mat-icon>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Hành động</th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button [matMenuTriggerFor]="m"><mat-icon>more_vert</mat-icon></button>
              <mat-menu #m="matMenu">
                <button mat-menu-item (click)="openDetails(r)"><mat-icon>visibility</mat-icon><span>Chi tiết</span></button>
                <button mat-menu-item (click)="openDialog(r)"><mat-icon>edit</mat-icon><span>Sửa</span></button>
                <button mat-menu-item (click)="delete(r)" class="delete-action"><mat-icon>delete</mat-icon><span>Xóa</span></button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
        <mat-paginator [pageSizeOptions]="[5,10,20]" showFirstLastButtons></mat-paginator>
      </mat-card-content>
    </mat-card>
  </div>
  `
})
export class ScriptGroupsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'page', 'group', 'status', 'priority', 'aiEnabled', 'actions'];
  dataSource = new MatTableDataSource<ScriptGroup>([]);
  pages: Fanpage[] = [];
  groups: ProductGroup[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private service: ScriptGroupsService,
    private pagesService: FanpagesService,
    private groupsService: ProductGroupsService,
    private router: Router,
  ) {}

  ngOnInit() { this.load(); }
  ngAfterViewInit() { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }

  load() {
    this.pagesService.getAll().subscribe({ next: d => this.pages = d });
    this.groupsService.getAllSimple().subscribe({ next: d => this.groups = d });
    this.service.getAll().subscribe({
      next: items => this.dataSource.data = items,
      error: () => this.show('Tải danh sách thất bại!'),
    });
  }

  renderPage(p: any) { return p && typeof p === 'object' && 'pageName' in p ? p.pageName : (this.pages.find(x => x._id === p)?.pageName || ''); }
  renderGroup(g: any) { return g && typeof g === 'object' && 'name' in g ? g.name : (this.groups.find(x => x._id === g)?.name || ''); }

  openDialog(row?: ScriptGroup) {
    const dialogRef = this.dialog.open(ScriptGroupDialogComponent, { width: '640px', data: { row, pages: this.pages, groups: this.groups } });
    dialogRef.afterClosed().subscribe(res => {
      if (!res) return;
      if (row && row._id) {
        this.service.update(row._id, res).subscribe({
          next: updated => { const idx = this.dataSource.data.findIndex(x => x._id === updated._id); if (idx>-1) { this.dataSource.data[idx] = updated; this.dataSource.data = [...this.dataSource.data]; } this.show('Cập nhật thành công'); },
          error: () => this.show('Cập nhật thất bại!')
        });
      } else {
        this.service.create(res).subscribe({
          next: created => { this.dataSource.data = [created, ...this.dataSource.data]; this.show('Tạo mới thành công'); },
          error: () => this.show('Tạo mới thất bại!')
        });
      }
    });
  }

  delete(row: ScriptGroup) {
    if (!row._id) return;
    if (!confirm(`Xóa nhóm kịch bản "${row.name}"?`)) return;
    this.service.delete(row._id).subscribe({ next: () => { this.dataSource.data = this.dataSource.data.filter(x => x._id !== row._id); this.show('Xóa thành công'); }, error: () => this.show('Xóa thất bại!') });
  }

  openDetails(row: ScriptGroup) {
    if (!row?._id) return;
    // Preserve current table state
    const state = {
      from: '/chatscripts',
      table: {
        pageIndex: this.paginator?.pageIndex ?? 0,
        pageSize: this.paginator?.pageSize ?? 10,
        sortActive: this.sort?.active ?? 'name',
        sortDirection: this.sort?.direction ?? 'asc',
        filter: (this.dataSource as any)?.filter ?? ''
      }
    };
    this.router.navigate(['/scenarios', row._id], { state });
  }

  private show(msg: string) { this.snackBar.open(msg, 'Đóng', { duration: 2500, verticalPosition: 'top' }); }
}
