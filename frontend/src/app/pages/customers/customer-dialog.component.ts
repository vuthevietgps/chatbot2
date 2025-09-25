import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomersService, Customer, CustomerStatus } from '../../services/customers.service';

@Component({
  selector: 'app-customer-dialog',
  templateUrl: './customer-dialog.component.html',
  styleUrls: ['./customer-dialog.component.scss']
})
export class CustomerDialogComponent {
  customerForm: FormGroup;
  isEdit: boolean;
  customerStatuses = Object.values(CustomerStatus);
  newTag = '';

  constructor(
    private fb: FormBuilder,
    private customersService: CustomersService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      customer?: Customer;
      fanpages: any[];
      availableTags: string[];
    }
  ) {
    this.isEdit = !!data.customer;
    this.customerForm = this.createForm();
    
    if (this.isEdit && data.customer) {
      this.customerForm.patchValue(data.customer);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s\(\)]*$/)]],
      email: ['', [Validators.email]],
      facebookId: [''],
      fanpageId: [''],
      tags: [[]],
      notes: [''],
      status: [CustomerStatus.NEW, Validators.required]
    });
  }

  onSubmit() {
    if (this.customerForm.valid) {
      const customerData = this.customerForm.value;
      
      const request = this.isEdit && this.data.customer
        ? this.customersService.updateCustomer(this.data.customer._id, customerData)
        : this.customersService.createCustomer(customerData);

      request.subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error saving customer:', error);
          this.snackBar.open('Lỗi khi lưu thông tin khách hàng', 'Đóng', { duration: 3000 });
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  addTag() {
    if (this.newTag.trim()) {
      const currentTags = this.customerForm.get('tags')?.value || [];
      if (!currentTags.includes(this.newTag.trim())) {
        currentTags.push(this.newTag.trim());
        this.customerForm.patchValue({ tags: currentTags });
      }
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    const currentTags = this.customerForm.get('tags')?.value || [];
    const updatedTags = currentTags.filter((t: string) => t !== tag);
    this.customerForm.patchValue({ tags: updatedTags });
  }

  addExistingTag(tag: string) {
    const currentTags = this.customerForm.get('tags')?.value || [];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      this.customerForm.patchValue({ tags: currentTags });
    }
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
}