import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <mat-toolbar class="header">
      <span class="title">Chatbot Management System</span>
      
      <div class="header-actions">
        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>
        
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item>
            <mat-icon>person</mat-icon>
            <span>Hồ sơ</span>
          </button>
          <button mat-menu-item>
            <mat-icon>settings</mat-icon>
            <span>Cài đặt</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Đăng xuất</span>
          </button>
        </mat-menu>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header {
      background: #3f51b5;
      color: white;
      padding: 0 20px;
    }
    
    .title {
      flex: 1;
      font-size: 20px;
      font-weight: 500;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  `]
})
export class HeaderComponent {
  logout() {
    // Implement logout logic
    console.log('Logout clicked');
  }
}