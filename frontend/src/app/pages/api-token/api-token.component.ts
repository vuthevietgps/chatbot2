import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Fanpage } from '../../services/fanpages.service';
import { ApiTokenService } from '../../services/api-token.service';

@Component({
  selector: 'app-api-token',
  template: `
    <div class="users-container">
      <div class="content-header">
        <h2>Quản lý API & Token</h2>
        <div class="actions-bar">
          <button mat-stroked-button color="primary" (click)="reload()">
            <mat-icon>refresh</mat-icon>
            Tải lại
          </button>
        </div>
      </div>

      <mat-card class="table-card">
        <mat-card-content>
          <table mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="pageName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Tên Fanpage</th>
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

            <ng-container matColumnDef="webhook">
              <th mat-header-cell *matHeaderCellDef>Subscribed</th>
              <td mat-cell *matCellDef="let f">
                <mat-icon [color]="f.webhookSubscribed ? 'primary' : undefined">{{ f.webhookSubscribed ? 'check_circle' : 'cancel' }}</mat-icon>
              </td>
            </ng-container>

            <ng-container matColumnDef="connectedBy">
              <th mat-header-cell *matHeaderCellDef>Kết nối bởi</th>
              <td mat-cell *matCellDef="let f">{{ renderConnectedBy(f.connectedBy) }}</td>
            </ng-container>

            <ng-container matColumnDef="lastRefreshed">
              <th mat-header-cell *matHeaderCellDef>Token Refreshed</th>
              <td mat-cell *matCellDef="let f">{{ f.lastRefreshed ? (f.lastRefreshed | date:'short') : '' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Hành động</th>
              <td mat-cell *matCellDef="let f" class="row-actions">
                <button mat-stroked-button color="primary" (click)="checkToken(f)">
                  <mat-icon>verified_user</mat-icon>
                  Check Token
                </button>
                <button mat-stroked-button color="accent" (click)="subscribe(f)">
                  <mat-icon>notifications_active</mat-icon>
                  Subscribe
                </button>
                <button mat-stroked-button color="warn" (click)="unsubscribe(f)">
                  <mat-icon>notifications_off</mat-icon>
                  Unsubscribe
                </button>
                <button mat-stroked-button (click)="promptRefresh(f)">
                  <mat-icon>autorenew</mat-icon>
                  Refresh
                </button>
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
    .row-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  `]
})
export class ApiTokenComponent implements OnInit {
  displayedColumns: string[] = ['pageName', 'pageId', 'status', 'webhook', 'connectedBy', 'lastRefreshed', 'actions'];
  dataSource = new MatTableDataSource<Fanpage>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private api: ApiTokenService, private snackBar: MatSnackBar) {}

  ngOnInit() { this.reload(); }
  ngAfterViewInit() { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }

  reload() {
    this.api.listFanpages().subscribe({
      next: d => this.dataSource.data = d,
      error: () => this.show('Tải danh sách thất bại!')
    });
  }

  renderConnectedBy(v: any) {
    if (!v) return '';
    if (typeof v === 'object' && ('fullName' in v || 'email' in v)) return (v.fullName || v.email || '') as string;
    return v;
  }

  statusColor(status?: string) {
    switch (status) {
      case 'active': return 'primary';
      case 'expired': return 'warn';
      default: return '';
    }
  }

  checkToken(f: Fanpage) {
    this.api.checkToken(f.pageId).subscribe({
      next: (res) => { f.status = res.status as any; this.dataSource.data = [...this.dataSource.data]; this.show(`Trạng thái: ${res.status}`); },
      error: (e) => this.show(`Kiểm tra thất bại: ${e?.error?.message || 'Lỗi'}`)
    });
  }
  subscribe(f: Fanpage) {
    this.api.subscribe(f.pageId).subscribe({
      next: () => { f.webhookSubscribed = true; this.dataSource.data = [...this.dataSource.data]; this.show('Đã subscribe webhook'); },
      error: (e) => this.show(`Subscribe thất bại: ${e?.error?.message || 'Lỗi'}`)
    });
  }
  unsubscribe(f: Fanpage) {
    this.api.unsubscribe(f.pageId).subscribe({
      next: () => { f.webhookSubscribed = false; this.dataSource.data = [...this.dataSource.data]; this.show('Đã unsubscribe webhook'); },
      error: (e) => this.show(`Unsubscribe thất bại: ${e?.error?.message || 'Lỗi'}`)
    });
  }
  promptRefresh(f: Fanpage) {
    const newToken = prompt('Nhập Access Token mới:');
    if (!newToken) return;
    this.api.refreshToken(f.pageId, newToken).subscribe({
      next: (res) => { f.accessToken = newToken; f.status = 'active'; f.lastRefreshed = res.lastRefreshed; this.dataSource.data = [...this.dataSource.data]; this.show('Refresh thành công'); },
      error: (e) => this.show(`Refresh thất bại: ${e?.error?.message || 'Lỗi'}`)
    });
  }

  private show(msg: string) { this.snackBar.open(msg, 'Đóng', { duration: 2500, verticalPosition: 'top' }); }
}
