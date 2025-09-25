import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Fanpage, FanpagesService } from '../../services/fanpages.service';
import { FanpageDialogComponent } from './fanpage-dialog.component';

@Component({
  selector: 'app-fanpages',
  template: `
    <div class="users-container">
      <div class="content-header">
  <h2>Quản lý Fanpage</h2>
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
            <ng-container matColumnDef="avatar">
              <th mat-header-cell *matHeaderCellDef>Avatar</th>
              <td mat-cell *matCellDef="let f">
                <img *ngIf="f.avatarUrl" [src]="f.avatarUrl" alt="avatar" width="28" height="28" style="border-radius:50%"/>
              </td>
            </ng-container>

            <ng-container matColumnDef="pageName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Tên</th>
              <td mat-cell *matCellDef="let f">{{ f.pageName }}</td>
            </ng-container>

            <ng-container matColumnDef="pageId">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let f">{{ f.pageId }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
              <td mat-cell *matCellDef="let f">
                <mat-chip-set>
                  <mat-chip [color]="statusColor(f.status)" selected>{{ f.status }}</mat-chip>
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="connectedAt">
              <th mat-header-cell *matHeaderCellDef>Kết nối</th>
              <td mat-cell *matCellDef="let f">{{ f.connectedAt | date:'short' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Hành động</th>
              <td mat-cell *matCellDef="let f">
                <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #actionMenu="matMenu">
                  <button mat-menu-item (click)="openDialog(f)">
                    <mat-icon>edit</mat-icon>
                    <span>Sửa</span>
                  </button>
                  <button mat-menu-item (click)="delete(f)" class="delete-action">
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
})
export class FanpagesComponent implements OnInit {
  displayedColumns: string[] = ['avatar', 'pageName', 'pageId', 'status', 'connectedAt', 'actions'];
  dataSource = new MatTableDataSource<Fanpage>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private service: FanpagesService,
  ) {}

  ngOnInit() { this.load(); }
  ngAfterViewInit() { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }

  load() {
    this.service.getAll().subscribe({
      next: (items) => this.dataSource.data = items,
      error: () => this.show('Tải danh sách fanpage thất bại!')
    });
  }

  openDialog(row?: Fanpage) {
    const dialogRef = this.dialog.open(FanpageDialogComponent, { width: '560px', data: row || null });
    dialogRef.afterClosed().subscribe(res => {
      if (!res) return;
      if (row && row._id) {
        this.service.update(row._id, res).subscribe({
          next: updated => {
            const idx = this.dataSource.data.findIndex(x => x._id === updated._id);
            if (idx > -1) { this.dataSource.data[idx] = updated; this.dataSource.data = [...this.dataSource.data]; }
            this.show('Cập nhật thành công');
          },
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

  delete(row: Fanpage) {
    if (!row._id) return;
    if (!confirm(`Xóa fanpage "${row.pageName}"?`)) return;
    this.service.delete(row._id).subscribe({
      next: () => { this.dataSource.data = this.dataSource.data.filter(x => x._id !== row._id); this.show('Xóa thành công'); },
      error: () => this.show('Xóa thất bại!')
    });
  }

  statusColor(status?: string) {
    switch (status) {
      case 'active': return 'primary';
      case 'expired': return 'warn';
      case 'removed': return '';
      default: return '';
    }
  }

  private show(msg: string) { this.snackBar.open(msg, 'Đóng', { duration: 2500, verticalPosition: 'top' }); }
}
