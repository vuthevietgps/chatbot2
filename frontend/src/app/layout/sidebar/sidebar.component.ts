import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  template: `
    <div class="sidebar-header">
      <h3>Chatbot Manager</h3>
    </div>
    
    <mat-nav-list>
      <mat-list-item routerLink="/users" routerLinkActive="active-link">
        <mat-icon matListItemIcon>people</mat-icon>
        <span matListItemTitle>Quản lý Users</span>
      </mat-list-item>
      
      <mat-list-item routerLink="/fanpages" routerLinkActive="active-link">
        <mat-icon matListItemIcon>pages</mat-icon>
        <span matListItemTitle>Quản lý Fanpage</span>
      </mat-list-item>
      
      <mat-list-item routerLink="/conversations" routerLinkActive="active-link">
        <mat-icon matListItemIcon>forum</mat-icon>
        <span matListItemTitle>Quản lý Tin nhắn</span>
      </mat-list-item>
      
      <mat-list-item routerLink="/chatscripts" routerLinkActive="active-link">
        <mat-icon matListItemIcon>chat</mat-icon>
        <span matListItemTitle>Kịch bản Chat</span>
      </mat-list-item>
      <mat-list-item routerLink="/scripts" routerLinkActive="active-link">
        <mat-icon matListItemIcon>smart_toy</mat-icon>
        <span matListItemTitle>Script chính</span>
      </mat-list-item>
      <mat-list-item routerLink="/sub-scripts" routerLinkActive="active-link">
        <mat-icon matListItemIcon>snippet_folder</mat-icon>
        <span matListItemTitle>Script con</span>
      </mat-list-item>
      <mat-list-item routerLink="/api-token" routerLinkActive="active-link">
        <mat-icon matListItemIcon>vpn_key</mat-icon>
        <span matListItemTitle>API & Token</span>
      </mat-list-item>
      
      <mat-list-item routerLink="/product-groups" routerLinkActive="active-link">
        <mat-icon matListItemIcon>category</mat-icon>
        <span matListItemTitle>Nhóm sản phẩm</span>
      </mat-list-item>

      <mat-list-item routerLink="/products" routerLinkActive="active-link">
        <mat-icon matListItemIcon>inventory_2</mat-icon>
        <span matListItemTitle>Quản lý Sản phẩm</span>
      </mat-list-item>

      <mat-list-item routerLink="/customers" routerLinkActive="active-link">
        <mat-icon matListItemIcon>contacts</mat-icon>
        <span matListItemTitle>Quản lý Khách hàng</span>
      </mat-list-item>

      <mat-list-item routerLink="/openai-config" routerLinkActive="active-link">
        <mat-icon matListItemIcon>psychology</mat-icon>
        <span matListItemTitle>Cấu hình OpenAI</span>
      </mat-list-item>
      
      <mat-divider></mat-divider>
      
      <mat-list-item>
        <mat-icon matListItemIcon>settings</mat-icon>
        <span matListItemTitle>Cài đặt</span>
      </mat-list-item>
      
      <mat-list-item (click)="logout()">
        <mat-icon matListItemIcon>exit_to_app</mat-icon>
        <span matListItemTitle>Đăng xuất</span>
      </mat-list-item>
    </mat-nav-list>
  `,
  styles: [`
    .sidebar-header {
      padding: 20px;
      background: #3f51b5;
      color: white;
      text-align: center;
    }
    
    .sidebar-header h3 {
      margin: 0;
      font-size: 18px;
    }
    
    .active-link {
      background: #e3f2fd !important;
    }
    
    mat-list-item:hover {
      background: #f5f5f5;
      cursor: pointer;
    }
    
    mat-icon {
      color: #666;
    }
  `]
})
export class SidebarComponent {
  logout() {
    // Implement logout logic
    console.log('Logout clicked');
  }
}