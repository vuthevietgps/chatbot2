import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubScript, SubScriptCreateRequest, SubScriptUpdateRequest } from '../../../models/sub-script.model';
import { SubScriptsService } from '../../../services/sub-scripts.service';
import { ProductsService } from '../../../services/products.service';
import { ProductGroupsService } from '../../../services/product-groups.service';
import { ScriptGroupsService } from '../../../services/script-groups.service';

@Component({
  selector: 'app-sub-script-dialog',
  templateUrl: './sub-script-dialog.component.html',
  styleUrls: ['./sub-script-dialog.component.scss']
})
export class SubScriptDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEditMode: boolean;
  products: any[] = [];
  productGroups: any[] = [];
  scriptGroups: any[] = [];

  actionTypes = [
    { value: 'none', label: 'Không có' },
    { value: 'add_tag', label: 'Gắn thẻ' },
    { value: 'set_variable', label: 'Lưu biến' },
    { value: 'call_webhook', label: 'Gọi Webhook' }
  ];

  matchModes = [
    { value: 'contains', label: 'Chứa từ khóa' },
    { value: 'exact', label: 'Khớp chính xác' },
    { value: 'startswith', label: 'Bắt đầu bằng' }
  ];

  constructor(
    private fb: FormBuilder,
    private subScriptsService: SubScriptsService,
    private productsService: ProductsService,
    private productGroupsService: ProductGroupsService,
    private scriptGroupsService: ScriptGroupsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SubScriptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      subScript: SubScript | null;
      scenarios: any[];
      mode: 'create' | 'edit';
    }
  ) {
    this.isEditMode = data.mode === 'edit';
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadProductGroups();
    
    if (this.isEditMode && this.data.subScript) {
      this.populateForm(this.data.subScript);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      scenario_id: ['', Validators.required],
      name: ['', Validators.required],
      trigger_keywords: this.fb.array([]),
      response_template: ['', Validators.required],
      product_id: [''],
      product_group_id: [''],
      priority: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      status: ['active', Validators.required],
      match_mode: ['contains', Validators.required],
      context_required: [''],
      action: this.fb.group({
        type: ['none', Validators.required],
        key: [''],
        value: [''],
        webhook_url: [''],
        tag_name: ['']
      })
    });

    // Add initial keyword field
    this.addKeyword();
  }

  get triggerKeywords(): FormArray {
    return this.form.get('trigger_keywords') as FormArray;
  }

  get actionType(): string {
    return this.form.get('action.type')?.value || 'none';
  }

  addKeyword(value: string = ''): void {
    this.triggerKeywords.push(this.fb.control(value, Validators.required));
  }

  removeKeyword(index: number): void {
    if (this.triggerKeywords.length > 1) {
      this.triggerKeywords.removeAt(index);
    }
  }

  onActionTypeChange(): void {
    const actionGroup = this.form.get('action') as FormGroup;
    const actionType = actionGroup.get('type')?.value;

    // Reset action fields
    actionGroup.patchValue({
      key: '',
      value: '',
      webhook_url: '',
      tag_name: ''
    });

    // Update validators based on action type
    const keyControl = actionGroup.get('key');
    const valueControl = actionGroup.get('value');
    const webhookControl = actionGroup.get('webhook_url');
    const tagControl = actionGroup.get('tag_name');

    // Clear all validators first
    keyControl?.clearValidators();
    valueControl?.clearValidators();
    webhookControl?.clearValidators();
    tagControl?.clearValidators();

    // Set validators based on action type
    switch (actionType) {
      case 'set_variable':
        keyControl?.setValidators([Validators.required]);
        valueControl?.setValidators([Validators.required]);
        break;
      case 'call_webhook':
        webhookControl?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
        break;
      case 'add_tag':
        tagControl?.setValidators([Validators.required]);
        break;
    }

    // Update validity
    keyControl?.updateValueAndValidity();
    valueControl?.updateValueAndValidity();
    webhookControl?.updateValueAndValidity();
    tagControl?.updateValueAndValidity();
  }

  populateForm(subScript: SubScript): void {
    // Clear existing keywords
    while (this.triggerKeywords.length) {
      this.triggerKeywords.removeAt(0);
    }

    // Add keywords
    if (subScript.trigger_keywords && subScript.trigger_keywords.length > 0) {
      subScript.trigger_keywords.forEach(keyword => {
        this.addKeyword(keyword);
      });
    } else {
      this.addKeyword();
    }

    // Populate form
    this.form.patchValue({
      scenario_id: subScript.scenario_id,
      name: subScript.name,
      response_template: subScript.response_template,
      product_id: subScript.product_id || '',
      product_group_id: subScript.product_group_id || '',
      priority: subScript.priority,
      status: subScript.status,
      match_mode: subScript.match_mode || 'contains',
      context_required: subScript.context_required || '',
      action: {
        type: subScript.action?.type || 'none',
        key: subScript.action?.key || '',
        value: subScript.action?.value || '',
        webhook_url: subScript.action?.webhook_url || '',
        tag_name: subScript.action?.tag_name || ''
      }
    });
  }

  loadProducts(): void {
    this.productsService.getAll().subscribe({
      next: (products: any) => {
        this.products = products;
      },
      error: (error: any) => {
        console.error('Error loading products:', error);
      }
    });
  }

  loadProductGroups(): void {
    this.productGroupsService.getAll().subscribe({
      next: (groups: any) => {
        this.productGroups = groups;
      },
      error: (error: any) => {
        console.error('Error loading product groups:', error);
      }
    });
  }

  loadScriptGroups(): void {
    this.scriptGroupsService.getAll().subscribe({
      next: (scriptGroups: any) => {
        this.scriptGroups = scriptGroups;
        console.log('Script groups loaded:', scriptGroups);
      },
      error: (error: any) => {
        console.error('Error loading script groups:', error);
      }
    });
  }

  onSubmit(): void {    
    if (this.form.valid) {
      this.loading = true;

      const formValue = this.form.value;
      
      // Filter out empty keywords
      const keywords = formValue.trigger_keywords.filter((k: string) => k.trim());

      const requestData = {
        scenario_id: formValue.scenario_id,
        name: formValue.name.trim(),
        trigger_keywords: keywords,
        response_template: formValue.response_template.trim(),
        product_id: formValue.product_id || undefined,
        product_group_id: formValue.product_group_id || undefined,
        priority: formValue.priority,
        status: formValue.status,
        match_mode: formValue.match_mode,
        context_required: formValue.context_required?.trim() || '',
        action: formValue.action,
        created_by: '66f2c2a4b3d4a5e6f7890123' // Temporary valid ObjectId for testing
      };

      const request$ = this.isEditMode
        ? this.subScriptsService.updateSubScript(this.data.subScript!._id!, requestData)
        : this.subScriptsService.createSubScript(requestData as SubScriptCreateRequest);

      request$.subscribe({
        next: (result) => {
          this.loading = false;
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error saving sub-script:', error);
          this.snackBar.open(
            `Lỗi khi ${this.isEditMode ? 'cập nhật' : 'tạo'} Script con`,
            'Đóng',
            { duration: 3000 }
          );
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          arrayControl.markAsTouched();
        });
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('required')) {
      return 'Trường này là bắt buộc';
    }
    if (control?.hasError('min')) {
      return 'Giá trị phải lớn hơn 0';
    }
    if (control?.hasError('max')) {
      return 'Giá trị không được vượt quá 100';
    }
    if (control?.hasError('pattern')) {
      return 'Định dạng không hợp lệ';
    }
    return '';
  }
}