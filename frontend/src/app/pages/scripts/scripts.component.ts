import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ScriptsService, Script } from '../../services/scripts.service';
import { ScriptGroupsService, ScriptGroup } from '../../services/script-groups.service';
import { ProductsService, Product } from '../../services/products.service';
import { ProductGroupsService, ProductGroup } from '../../services/product-groups.service';
import { ScriptDialogComponent } from './script-dialog.component';

@Component({
  selector: 'app-scripts',
  template: `
  <div class="users-container">
    <div class="content-header">
      <h2>Quản lý Script con</h2>
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
            <td mat-cell *matCellDef="let r">{{ r.name }}</td>
          </ng-container>
          <ng-container matColumnDef="group">
            <th mat-header-cell *matHeaderCellDef>Nhóm kịch bản</th>
            <td mat-cell *matCellDef="let r">{{ renderScriptGroup(r.scriptGroupId) }}</td>
          </ng-container>
          <ng-container matColumnDef="triggers">
            <th mat-header-cell *matHeaderCellDef>Triggers</th>
            <td mat-cell *matCellDef="let r">{{ (r.trigger||[]).join(', ') }}</td>
          </ng-container>
          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef>Ưu tiên</th>
            <td mat-cell *matCellDef="let r">{{ r.priority ?? 0 }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
            <td mat-cell *matCellDef="let r">{{ r.status }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Hành động</th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button [matMenuTriggerFor]="m"><mat-icon>more_vert</mat-icon></button>
              <mat-menu #m="matMenu">
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
export class ScriptsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'group', 'triggers', 'priority', 'status', 'actions'];
  dataSource = new MatTableDataSource<Script>([]);
  scriptGroups: ScriptGroup[] = [];
  products: Product[] = [];
  productGroups: ProductGroup[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private service: ScriptsService,
    private sgService: ScriptGroupsService,
    private productsService: ProductsService,
    private productGroupsService: ProductGroupsService,
  ) {}

  ngOnInit() { this.load(); }
  ngAfterViewInit() { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }

  load() {
    this.sgService.getAll().subscribe({ next: d => this.scriptGroups = d });
    this.productsService.getAll().subscribe({ next: d => this.products = d.data });
    this.productGroupsService.getAllSimple().subscribe({ next: d => this.productGroups = d });
    this.service.getAll().subscribe({ next: items => this.dataSource.data = items, error: () => this.show('Tải danh sách thất bại!') });
  }

  renderScriptGroup(v: any) { return v && typeof v === 'object' && 'name' in v ? v.name : (this.scriptGroups.find(x => x._id === v)?.name || ''); }

  openDialog(row?: Script) {
    const dialogRef = this.dialog.open(ScriptDialogComponent, {
      width: '720px',
      data: { row, scriptGroups: this.scriptGroups, products: this.products, productGroups: this.productGroups }
    });
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

  delete(row: Script) {
    if (!row._id) return;
    if (!confirm(`Xóa script "${row.name}"?`)) return;
    this.service.delete(row._id).subscribe({ next: () => { this.dataSource.data = this.dataSource.data.filter(x => x._id !== row._id); this.show('Xóa thành công'); }, error: () => this.show('Xóa thất bại!') });
  }

  private show(msg: string) { this.snackBar.open(msg, 'Đóng', { duration: 2500, verticalPosition: 'top' }); }
}
