import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { 
  CustomersService, 
  Customer, 
  CustomerStatus, 
  Conversation, 
  ConversationResponse 
} from '../../services/customers.service';

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  conversations: Conversation[] = [];
  loadingConversations = false;
  conversationPage = 1;
  conversationLimit = 10;
  totalConversations = 0;

  constructor(
    private customersService: CustomersService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CustomerDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      customer: Customer;
    }
  ) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.loadingConversations = true;
    
    this.customersService.getConversations(
      this.data.customer._id, 
      this.conversationPage, 
      this.conversationLimit
    ).subscribe({
      next: (response: ConversationResponse) => {
        this.conversations = response.conversations;
        this.totalConversations = response.total;
        this.loadingConversations = false;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.snackBar.open('Lỗi khi tải lịch sử hội thoại', 'Đóng', { duration: 3000 });
        this.loadingConversations = false;
      }
    });
  }

  onClose() {
    this.dialogRef.close();
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
}