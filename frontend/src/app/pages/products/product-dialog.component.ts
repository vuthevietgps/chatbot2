import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductGroup } from '../../services/product-groups.service';
import { Product, ProductStatus, ProductCurrency } from '../../services/products.service';

@Component({
  selector: 'app-product-dialog',
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>{{ data.row ? 'Sửa' : 'Thêm mới' }} Sản phẩm</h2>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form" class="product-form">
        
        <!-- Basic Information -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>Thông tin cơ bản</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Tên sản phẩm *</mat-label>
                <input matInput formControlName="name" required>
                <mat-error *ngIf="form.get('name')?.hasError('required')">Tên sản phẩm là bắt buộc</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>SKU *</mat-label>
                <input matInput formControlName="sku" required placeholder="VD: SP001">
                <mat-error *ngIf="form.get('sku')?.hasError('required')">SKU là bắt buộc</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nhóm sản phẩm *</mat-label>
                <mat-select formControlName="groupId" required>
                  <mat-option *ngFor="let g of data.groups" [value]="g._id">{{ g.name }}</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('groupId')?.hasError('required')">Nhóm sản phẩm là bắt buộc</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mô tả ngắn</mat-label>
                <textarea matInput formControlName="shortDescription" rows="2" 
                          placeholder="Mô tả ngắn gọn về sản phẩm..."></textarea>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mô tả chi tiết</mat-label>
                <textarea matInput formControlName="description" rows="4" 
                          placeholder="Mô tả chi tiết về sản phẩm..."></textarea>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Pricing & Status -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>Giá & Trạng thái</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Giá bán *</mat-label>
                <input matInput type="number" formControlName="price" required min="0">
                <mat-error *ngIf="form.get('price')?.hasError('required')">Giá bán là bắt buộc</mat-error>
                <mat-error *ngIf="form.get('price')?.hasError('min')">Giá phải lớn hơn 0</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Giá khuyến mãi</mat-label>
                <input matInput type="number" formControlName="salePrice" min="0">
                <mat-error *ngIf="form.get('salePrice')?.hasError('min')">Giá phải lớn hơn 0</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tiền tệ</mat-label>
                <mat-select formControlName="currency">
                  <mat-option value="VND">VND</mat-option>
                  <mat-option value="USD">USD</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Trạng thái</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="active">Đang bán</mat-option>
                  <mat-option value="inactive">Tạm ẩn</mat-option>
                  <mat-option value="out_of_stock">Hết hàng</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tồn kho</mat-label>
                <input matInput type="number" formControlName="stock" min="0">
                <mat-error *ngIf="form.get('stock')?.hasError('min')">Tồn kho phải lớn hơn hoặc bằng 0</mat-error>
              </mat-form-field>

              <div class="checkbox-field">
                <mat-checkbox formControlName="featured" color="primary">
                  Sản phẩm nổi bật
                </mat-checkbox>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Images -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>Hình ảnh sản phẩm</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div formArrayName="images">
              <div class="image-row" *ngFor="let ctrl of images.controls; let i = index">
                <mat-form-field appearance="outline" class="image-url-field">
                  <mat-label>URL hình ảnh {{i + 1}}</mat-label>
                  <input matInput [formControlName]="i" placeholder="https://example.com/image.jpg">
                </mat-form-field>
                <div class="image-preview" *ngIf="ctrl.value">
                  <img [src]="ctrl.value" alt="Preview" (error)="onImageError($event)">
                </div>
                <button mat-icon-button color="warn" (click)="removeImage(i)" type="button">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
              <button mat-stroked-button (click)="addImage()" type="button" class="add-button">
                <mat-icon>add</mat-icon> Thêm hình ảnh
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Variants -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>Biến thể sản phẩm</mat-card-title>
            <mat-card-subtitle>Thêm các biến thể như Size, Màu sắc, v.v.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div formArrayName="variants">
              <div class="variant-table" *ngIf="variants.length > 0">
                <div class="variant-header">
                  <div>Thuộc tính</div>
                  <div>Giá trị</div>
                  <div>Giá cộng thêm</div>
                  <div>Hành động</div>
                </div>
                <div class="variant-row" *ngFor="let variant of variants.controls; let i = index" [formGroupName]="i">
                  <mat-form-field appearance="outline">
                    <mat-label>Thuộc tính</mat-label>
                    <input matInput formControlName="attribute" placeholder="VD: Size, Màu">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Giá trị</mat-label>
                    <input matInput formControlName="value" placeholder="VD: M, L, XL">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Giá cộng thêm</mat-label>
                    <input matInput type="number" formControlName="extraPrice" min="0" placeholder="0">
                  </mat-form-field>
                  <button mat-icon-button color="warn" (click)="removeVariant(i)" type="button">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              <button mat-stroked-button (click)="addVariant()" type="button" class="add-button">
                <mat-icon>add</mat-icon> Thêm biến thể
              </button>
            </div>
          </mat-card-content>
        </mat-card>

      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || loading" (click)="onSave()">
        <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
        <span *ngIf="!loading">{{ data.row ? 'Cập nhật' : 'Tạo mới' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      max-height: 70vh;
      overflow-y: auto;
      padding: 20px;
    }

    .product-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-section {
      margin-bottom: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .half-width {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .checkbox-field {
      display: flex;
      align-items: center;
      margin-top: 8px;
    }

    .image-row {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
    }

    .image-url-field {
      flex: 1;
    }

    .image-preview {
      width: 60px;
      height: 60px;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .variant-table {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .variant-header {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 16px;
      padding: 12px;
      background: #f5f5f5;
      font-weight: 500;
      align-items: center;
    }

    .variant-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 16px;
      padding: 12px;
      border-top: 1px solid #ddd;
      align-items: center;
    }

    .add-button {
      width: fit-content;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #ddd;
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }

      .variant-header,
      .variant-row {
        grid-template-columns: 1fr;
        gap: 8px;
      }
    }
  `]
})
export class ProductDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { row?: any; groups: ProductGroup[] }
  ) {}

  ngOnInit() {
    const row = this.data?.row;
    this.form = this.fb.group({
      name: [row?.name || '', [Validators.required, Validators.minLength(2)]],
      sku: [row?.sku || '', [Validators.required, Validators.pattern(/^[A-Z0-9_-]+$/)]],
      groupId: [row?.groupId || '', Validators.required],
      shortDescription: [row?.shortDescription || ''],
      description: [row?.description || ''],
      price: [row?.price || 0, [Validators.required, Validators.min(0.01)]],
      salePrice: [row?.salePrice || null, [Validators.min(0.01)]],
      currency: [row?.currency || 'VND', Validators.required],
      status: [row?.status || 'active', Validators.required],
      stock: [row?.stock || 0, [Validators.min(0)]],
      featured: [row?.featured || false],
      images: this.fb.array(this.initializeImages()),
      variants: this.fb.array(this.initializeVariants())
    });

    // Add custom validator for salePrice
    this.form.get('salePrice')?.setValidators([
      Validators.min(0.01),
      this.salePriceValidator.bind(this)
    ]);
  }

  private initializeImages(): FormControl[] {
    const row = this.data?.row;
    if (row?.images && Array.isArray(row.images)) {
      return row.images.map((url: string) => this.fb.control(url, [this.urlValidator]));
    }
    return [];
  }

  private initializeVariants(): FormGroup[] {
    const row = this.data?.row;
    if (row?.variants && Array.isArray(row.variants)) {
      return row.variants.map((variant: any) => 
        this.fb.group({
          attribute: [variant.attribute || '', Validators.required],
          value: [variant.value || '', Validators.required],
          extraPrice: [variant.extraPrice || 0, [Validators.min(0)]]
        })
      );
    }
    return [];
  }

  // Custom validators
  private salePriceValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const price = this.form?.get('price')?.value || 0;
    const salePrice = control.value;
    
    if (salePrice >= price) {
      return { salePriceHigherThanPrice: true };
    }
    return null;
  }

  private urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(control.value)) {
      return { invalidUrl: true };
    }
    return null;
  }

  // Getters for form arrays
  get images() {
    return this.form.get('images') as FormArray;
  }

  get variants() {
    return this.form.get('variants') as FormArray;
  }

  // Image management
  addImage() {
    const imageControl = this.fb.control('', [this.urlValidator]);
    this.images.push(imageControl);
  }

  removeImage(index: number) {
    this.images.removeAt(index);
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/no-image.png'; // Fallback image
  }

  // Variant management
  addVariant() {
    const variantGroup = this.fb.group({
      attribute: ['', Validators.required],
      value: ['', Validators.required],
      extraPrice: [0, [Validators.min(0)]]
    });
    this.variants.push(variantGroup);
  }

  removeVariant(index: number) {
    this.variants.removeAt(index);
  }

  // Form submission
  onSave() {
    if (this.form.valid) {
      this.loading = true;
      
      // Clean up form data
      const formData = { ...this.form.value };
      
      // Remove empty images
      formData.images = formData.images.filter((url: string) => url && url.trim());
      
      // Remove empty variants
      formData.variants = formData.variants.filter((variant: any) => 
        variant.attribute && variant.value
      );
      
      // Convert numeric strings to numbers
      formData.price = Number(formData.price);
      if (formData.salePrice) {
        formData.salePrice = Number(formData.salePrice);
      }
      formData.stock = Number(formData.stock);
      
      // Format variants extraPrice
      formData.variants.forEach((variant: any) => {
        variant.extraPrice = Number(variant.extraPrice) || 0;
      });

      setTimeout(() => {
        this.loading = false;
        this.dialogRef.close(formData);
      }, 500);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.form);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control?.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl, index) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else if (arrayControl instanceof FormControl) {
            arrayControl?.markAsTouched({ onlySelf: true });
          }
        });
      }
    });
  }

  // Utility methods for template
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} là bắt buộc`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} phải có ít nhất ${control.errors?.['minlength'].requiredLength} ký tự`;
    }
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} phải lớn hơn ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('pattern')) {
      return `${this.getFieldLabel(fieldName)} không đúng định dạng`;
    }
    if (control?.hasError('salePriceHigherThanPrice')) {
      return 'Giá khuyến mãi phải nhỏ hơn giá bán';
    }
    if (control?.hasError('invalidUrl')) {
      return 'URL không hợp lệ';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Tên sản phẩm',
      sku: 'SKU',
      groupId: 'Nhóm sản phẩm',
      price: 'Giá bán',
      salePrice: 'Giá khuyến mãi',
      stock: 'Tồn kho'
    };
    return labels[fieldName] || fieldName;
  }
}
