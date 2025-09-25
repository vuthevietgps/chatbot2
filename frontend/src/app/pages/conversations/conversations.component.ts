import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Conversation, ConversationsService } from '../../services/conversations.service';

@Component({
  selector: 'app-conversations',
  template: `
    <div class="users-container">
      <div class="content-header">
        <h2>Hội thoại (Inbox)</h2>
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
            <ng-container matColumnDef="pageId">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Fanpage</th>
              <td mat-cell *matCellDef="let conv">{{ conv.pageId }}</td>
            </ng-container>

            <ng-container matColumnDef="psid">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Khách hàng (PSID)</th>
              <td mat-cell *matCellDef="let conv">
                <span class="psid-text">{{ conv.psid }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="lastMessage">
              <th mat-header-cell *matHeaderCellDef>Tin nhắn cuối</th>
              <td mat-cell *matCellDef="let conv" class="last-message">
                {{ truncateMessage(conv.lastMessage) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Trạng thái</th>
              <td mat-cell *matCellDef="let conv">
                <mat-chip-set>
                  <mat-chip [color]="statusColor(conv.status)" selected>
                    {{ getStatusLabel(conv.status) }}
                  </mat-chip>
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="lastUpdated">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Cập nhật</th>
              <td mat-cell *matCellDef="let conv">{{ conv.lastUpdated | date:'short' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Hành động</th>
              <td mat-cell *matCellDef="let conv">
                <button mat-stroked-button color="primary" (click)="viewMessages(conv)">
                  <mat-icon>chat</mat-icon>
                  Xem tin nhắn
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                [class.highlight-new]="isRecentConversation(row)"></tr>
          </table>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .psid-text {
      font-family: monospace;
      font-size: 0.9em;
      color: #666;
    }
    .last-message {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .highlight-new {
      background-color: #f3f8ff !important;
    }
  `]
})
export class ConversationsComponent implements OnInit {
  displayedColumns: string[] = ['pageId', 'psid', 'lastMessage', 'status', 'lastUpdated', 'actions'];
  dataSource = new MatTableDataSource<Conversation>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private service: ConversationsService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() { this.reload(); }
  ngAfterViewInit() { 
    this.dataSource.paginator = this.paginator; 
    this.dataSource.sort = this.sort; 
  }

  reload() {
    this.service.getAll().subscribe({
      next: d => this.dataSource.data = d,
      error: () => this.show('Tải danh sách thất bại!')
    });
  }

  viewMessages(conversation: Conversation) {
    this.router.navigate(['/messages', conversation.id]);
  }

  truncateMessage(message: string, maxLength: number = 50): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }

  statusColor(status: string): string {
    switch (status) {
      case 'open': return 'primary';
      case 'pending': return 'accent';
      case 'closed': return '';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'open': return 'Mở';
      case 'pending': return 'Chờ';
      case 'closed': return 'Đóng';
      default: return status;
    }
  }

  isRecentConversation(conv: Conversation): boolean {
    const lastUpdated = new Date(conv.lastUpdated);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastUpdated > oneHourAgo;
  }

  private show(msg: string) { 
    this.snackBar.open(msg, 'Đóng', { duration: 2500, verticalPosition: 'top' }); 
  }
}