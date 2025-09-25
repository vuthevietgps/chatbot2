import { Component } from '@angular/core';

@Component({
  selector: 'app-layout',
  template: `
    <div class="sidebar-container">
      <app-sidebar class="sidebar"></app-sidebar>
      <div class="main-content">
        <app-header></app-header>
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      display: flex;
      height: 100vh;
    }
    
    .sidebar {
      width: 250px;
      background: #f5f5f5;
      border-right: 1px solid #e0e0e0;
    }
    
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class LayoutComponent {}