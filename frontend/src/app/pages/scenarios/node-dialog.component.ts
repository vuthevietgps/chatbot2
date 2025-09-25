import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Node, NodeType } from '../../services/scenarios.service';

@Component({
  selector: 'app-node-dialog',
  template: `
    <h2 mat-dialog-title>Thêm Node</h2>
    <mat-dialog-content [formGroup]="form" class="dialog-form">
      <div class="row">
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Loại node</mat-label>
          <mat-select formControlName="type" required (selectionChange)="onTypeChange()">
            <mat-option value="text">Text</mat-option>
            <mat-option value="media">Media (ảnh/video)</mat-option>
            <mat-option value="quick_reply">Quick Reply</mat-option>
            <mat-option value="carousel">Carousel</mat-option>
            <mat-option value="form">Form</mat-option>
            <mat-option value="action">Action</mat-option>
            <mat-option value="ai_reply">AI Reply</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-50">
          <mat-label>Tên node</mat-label>
          <input matInput formControlName="name" placeholder="ví dụ: Lời chào" required>
          <mat-error *ngIf="form.controls.name.invalid">Bắt buộc</mat-error>
        </mat-form-field>
      </div>

      <!-- TEXT NODE -->
      <div class="row" *ngIf="form.value.type === 'text'" [formGroup]="textGroup">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Nội dung</mat-label>
          <textarea matInput rows="4" formControlName="text" placeholder="Xin chào, {{'{{customer_name}}'}}!" required></textarea>
          <mat-hint>Hỗ trợ chèn biến dạng {{'{{variable}}'}} (1–1000 ký tự)</mat-hint>
        </mat-form-field>
      </div>

      <!-- MEDIA NODE -->
      <div *ngIf="form.value.type === 'media'" [formGroup]="mediaGroup" class="col">
        <div class="row">
          <mat-form-field appearance="outline" class="w-50">
            <mat-label>Loại media</mat-label>
            <mat-select formControlName="mediaType" required>
              <mat-option value="image">Image</mat-option>
              <mat-option value="video">Video</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-50">
            <mat-label>URL</mat-label>
            <input matInput formControlName="url" placeholder="https://..." required>
            <mat-error *ngIf="mediaGroup.controls.url.invalid">Bắt buộc</mat-error>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Caption (tối đa 200 ký tự)</mat-label>
          <input matInput formControlName="caption">
        </mat-form-field>
      </div>

      <!-- QUICK REPLY NODE -->
      <div *ngIf="form.value.type === 'quick_reply'" [formGroup]="qrGroup" class="col">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Câu hỏi</mat-label>
          <input matInput formControlName="text" required>
        </mat-form-field>
        <div class="subheader">Danh sách lựa chọn</div>
        <div formArrayName="options" class="list">
          <div class="row" *ngFor="let opt of options.controls; let i = index" [formGroupName]="i">
            <mat-form-field appearance="outline" class="w-50">
              <mat-label>Tiêu đề</mat-label>
              <input matInput formControlName="title" maxlength="30" required>
              <mat-hint align="end">{{opt.get('title')?.value?.length || 0}} / 30</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-50">
              <mat-label>Next Node</mat-label>
              <mat-select formControlName="nextNodeId">
                <mat-option [value]="null">(không chọn)</mat-option>
                <mat-option *ngFor="let n of nodes" [value]="n.id">{{ n.name || n.id }}</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-icon-button color="warn" (click)="removeOption(i)"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
        <button mat-stroked-button (click)="addOption()"><mat-icon>add</mat-icon> Thêm lựa chọn</button>
      </div>

      <!-- CAROUSEL NODE -->
      <div *ngIf="form.value.type === 'carousel'" [formGroup]="carouselGroup" class="col">
        <div class="row">
          <mat-radio-group formControlName="source" class="row" style="gap:16px; align-items:center;">
            <mat-radio-button value="manual">Manual</mat-radio-button>
            <mat-radio-button value="product_group">Nhóm sản phẩm</mat-radio-button>
          </mat-radio-group>
        </div>
        <div class="row" *ngIf="carouselGroup.value.source === 'product_group'">
          <mat-form-field appearance="outline" class="w-50">
            <mat-label>Product Group ID</mat-label>
            <input matInput formControlName="product_group_id" placeholder="pg-001">
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-50">
            <mat-label>Limit</mat-label>
            <input matInput type="number" min="1" formControlName="limit">
          </mat-form-field>
        </div>
        <div *ngIf="carouselGroup.value.source === 'manual'">
          <div class="subheader">Cards</div>
          <div formArrayName="cards" class="list">
            <div class="card" *ngFor="let card of cards.controls; let ci = index" [formGroupName]="ci">
              <div class="row">
                <mat-form-field appearance="outline" class="w-50"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
                <mat-form-field appearance="outline" class="w-50"><mat-label>Subtitle</mat-label><input matInput formControlName="subtitle"></mat-form-field>
              </div>
              <div class="row">
                <mat-form-field appearance="outline" class="w-100"><mat-label>Image URL</mat-label><input matInput formControlName="image"></mat-form-field>
              </div>
              <div class="subheader">Buttons</div>
              <div formArrayName="buttons">
                <div class="row" *ngFor="let btn of getCardButtons(ci).controls; let bi = index" [formGroupName]="bi">
                  <mat-form-field appearance="outline" class="w-50"><mat-label>Title</mat-label><input matInput formControlName="title"></mat-form-field>
                  <mat-form-field appearance="outline" class="w-50"><mat-label>Next Node</mat-label>
                    <mat-select formControlName="nextNodeId">
                      <mat-option [value]="null">(không chọn)</mat-option>
                      <mat-option *ngFor="let n of nodes" [value]="n.id">{{ n.name || n.id }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <button mat-icon-button color="warn" (click)="removeCardButton(ci, bi)"><mat-icon>delete</mat-icon></button>
                </div>
              </div>
              <button mat-stroked-button (click)="addCardButton(ci)"><mat-icon>add</mat-icon> Thêm button</button>
              <div>
                <button mat-button color="warn" (click)="removeCard(ci)"><mat-icon>delete</mat-icon> Xóa card</button>
              </div>
            </div>
          </div>
          <button mat-stroked-button (click)="addCard()"><mat-icon>add</mat-icon> Thêm card</button>
        </div>
      </div>

      <!-- FORM NODE -->
      <div *ngIf="form.value.type === 'form'" [formGroup]="formNodeGroup" class="col">
        <mat-form-field appearance="outline" class="w-100"><mat-label>Intro message</mat-label><input matInput formControlName="intro"></mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="w-50"><mat-label>Save to</mat-label>
            <mat-select formControlName="saveTo"><mat-option value="customer">Customer</mat-option><mat-option value="variable">Variable</mat-option></mat-select>
          </mat-form-field>
        </div>
        <div class="subheader">Fields</div>
        <div formArrayName="fields" class="list">
          <div class="row" *ngFor="let f of fields.controls; let i = index" [formGroupName]="i">
            <mat-form-field appearance="outline" class="w-25"><mat-label>Key</mat-label><input matInput formControlName="key"></mat-form-field>
            <mat-form-field appearance="outline" class="w-25"><mat-label>Label</mat-label><input matInput formControlName="label"></mat-form-field>
            <mat-form-field appearance="outline" class="w-25"><mat-label>Type</mat-label>
              <mat-select formControlName="type"><mat-option value="text">text</mat-option><mat-option value="email">email</mat-option><mat-option value="phone">phone</mat-option></mat-select>
            </mat-form-field>
            <mat-checkbox formControlName="required">Bắt buộc</mat-checkbox>
            <button mat-icon-button color="warn" (click)="removeField(i)"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
        <button mat-stroked-button (click)="addField()"><mat-icon>add</mat-icon> Thêm field</button>
      </div>

      <!-- ACTION NODE -->
      <div *ngIf="form.value.type === 'action'" [formGroup]="actionGroup" class="col">
        <div class="subheader">Actions</div>
        <div formArrayName="actions" class="list">
          <div class="action-row" *ngFor="let a of actions.controls; let i = index" [formGroupName]="i">
            <mat-form-field appearance="outline" class="w-25"><mat-label>Loại</mat-label>
              <mat-select formControlName="type" (selectionChange)="onActionTypeChange(i)">
                <mat-option value="add_tag">Add Tag</mat-option>
                <mat-option value="set_variable">Set Variable</mat-option>
                <mat-option value="call_webhook">Call Webhook</mat-option>
              </mat-select>
            </mat-form-field>

            <ng-container [ngSwitch]="a.get('type')?.value">
              <ng-container *ngSwitchCase="'add_tag'">
                <mat-form-field appearance="outline" class="w-50"><mat-label>Tag</mat-label><input matInput formControlName="value"></mat-form-field>
              </ng-container>
              <ng-container *ngSwitchCase="'set_variable'">
                <mat-form-field appearance="outline" class="w-25"><mat-label>Key</mat-label><input matInput formControlName="key"></mat-form-field>
                <mat-form-field appearance="outline" class="w-25"><mat-label>Value</mat-label><input matInput formControlName="value"></mat-form-field>
              </ng-container>
              <ng-container *ngSwitchCase="'call_webhook'">
                <mat-form-field appearance="outline" class="w-50"><mat-label>URL</mat-label><input matInput formControlName="url"></mat-form-field>
                <mat-form-field appearance="outline" class="w-25"><mat-label>Method</mat-label>
                  <mat-select formControlName="method"><mat-option value="GET">GET</mat-option><mat-option value="POST">POST</mat-option><mat-option value="PUT">PUT</mat-option><mat-option value="PATCH">PATCH</mat-option><mat-option value="DELETE">DELETE</mat-option></mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-100"><mat-label>Headers (JSON)</mat-label><textarea matInput rows="3" formControlName="headers"></textarea></mat-form-field>
                <mat-form-field appearance="outline" class="w-100"><mat-label>Body (JSON template)</mat-label><textarea matInput rows="3" formControlName="body"></textarea></mat-form-field>
              </ng-container>
            </ng-container>

            <button mat-icon-button color="warn" (click)="removeAction(i)"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
        <button mat-stroked-button (click)="addAction()"><mat-icon>add</mat-icon> Thêm action</button>
      </div>

      <!-- AI REPLY NODE -->
      <div *ngIf="form.value.type === 'ai_reply'" [formGroup]="aiGroup" class="col">
        <mat-checkbox formControlName="useScenarioAI">Dùng cấu hình AI mặc định của kịch bản</mat-checkbox>
        <div [formGroup]="aiOverrideGroup" *ngIf="!aiGroup.value.useScenarioAI" class="col">
          <div class="row">
            <mat-form-field appearance="outline" class="w-50"><mat-label>Model</mat-label><input matInput formControlName="model" required></mat-form-field>
            <mat-form-field appearance="outline" class="w-25"><mat-label>Temperature</mat-label><input matInput type="number" step="0.1" formControlName="temperature"></mat-form-field>
            <mat-form-field appearance="outline" class="w-25"><mat-label>Max Tokens</mat-label><input matInput type="number" formControlName="max_tokens"></mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="w-100"><mat-label>System Prompt</mat-label><textarea matInput rows="3" formControlName="systemPrompt" required></textarea></mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="w-25"><mat-label>Max history messages</mat-label><input matInput type="number" min="1" max="10" formControlName="maxHistoryMessages"></mat-form-field>
      </div>

      <div class="row">
        <mat-checkbox formControlName="is_entry">Là node bắt đầu</mat-checkbox>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Hủy</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form .row { display: flex; gap: 12px; align-items: center; }
    .w-50 { width: 50%; }
    .w-100 { width: 100%; }
  `]
})
export class NodeDialogComponent {
  nodes: Node[] = [];
  form = this.fb.group({
    type: ['text' as NodeType, Validators.required],
    name: [''],
    is_entry: [false],
  });

  // Groups per type
  textGroup = this.fb.group({ text: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]] });
  mediaGroup = this.fb.group({ mediaType: ['image', Validators.required], url: ['', Validators.required], caption: ['', [Validators.maxLength(200)]] });
  qrGroup = this.fb.group({ text: ['', Validators.required], options: this.fb.array([]) });
  carouselGroup = this.fb.group({ source: ['product_group'], product_group_id: [''], limit: [5], cards: this.fb.array([]) });
  formNodeGroup = this.fb.group({ intro: [''], saveTo: ['customer'], fields: this.fb.array([]) });
  actionGroup = this.fb.group({ actions: this.fb.array([]) });
  aiGroup = this.fb.group({ useScenarioAI: [true], maxHistoryMessages: [5] });
  aiOverrideGroup = this.fb.group({ model: [''], temperature: [0.4], max_tokens: [512], systemPrompt: [''] });

  constructor(
    public dialogRef: MatDialogRef<NodeDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.nodes = (data?.nodes as Node[]) || [];
    // Init defaults
    this.addOption();
    this.addField();
  }

  onTypeChange() {
    // Adjust validators for name: optional globally, but keep input.
  }

  submit() {
    const val = this.form.value as any;
    let content: any = {};
    const type = val.type as NodeType;

    // Type-specific validations
    if (type === 'text') {
      if (this.textGroup.invalid) return;
      content = { text: this.textGroup.value.text };
    }
    else if (type === 'media') {
      if (this.mediaGroup.invalid) return;
      content = { mediaType: this.mediaGroup.value.mediaType, url: this.mediaGroup.value.url, caption: this.mediaGroup.value.caption };
    }
    else if (type === 'quick_reply') {
      if (this.qrGroup.invalid || this.options.length < 1) return;
      content = { text: this.qrGroup.value.text, options: this.options.value.map((o: any) => ({ title: o.title, nextNodeId: o.nextNodeId ?? null })) };
    }
    else if (type === 'carousel') {
      const src = this.carouselGroup.value.source;
      if (src === 'product_group') {
        if (!this.carouselGroup.value.product_group_id) return;
        content = { source: 'product_group', product_group_id: this.carouselGroup.value.product_group_id, limit: this.carouselGroup.value.limit || 5 };
      } else {
        if (this.cards.length < 1) return;
        content = { source: 'manual', cards: this.cards.value.map((c: any) => ({ title: c.title, subtitle: c.subtitle, image: c.image, buttons: (c.buttons || []).map((b: any) => ({ title: b.title, nextNodeId: b.nextNodeId ?? null })) })) };
      }
    }
    else if (type === 'form') {
      if (this.fields.length < 1) return;
      // Unique key check
      const keys = this.fields.value.map((f: any) => f.key).filter((k: any) => !!k);
      const hasDup = new Set(keys).size !== keys.length;
      if (hasDup) return;
      content = { intro: this.formNodeGroup.value.intro, fields: this.fields.value.map((f: any) => ({ key: f.key, label: f.label, type: f.type, required: !!f.required })), saveTo: this.formNodeGroup.value.saveTo };
    }
    else if (type === 'action') {
      if (this.actions.length < 1) return;
      const actions = this.actions.value.map((a: any) => {
        if (a.type === 'add_tag') return { type: 'add_tag', value: a.value };
        if (a.type === 'set_variable') return { type: 'set_variable', key: a.key, value: a.value };
        if (a.type === 'call_webhook') {
          let headers: any = undefined; let body: any = undefined;
          try { headers = a.headers ? JSON.parse(a.headers) : undefined; } catch {}
          try { body = a.body ? JSON.parse(a.body) : undefined; } catch {}
          return { type: 'call_webhook', url: a.url, method: a.method || 'POST', headers, body };
        }
        return a;
      });
      content = { actions };
    }
    else if (type === 'ai_reply') {
  const useScenarioAI = this.aiGroup.value.useScenarioAI;
  const override = !useScenarioAI ? this.aiOverrideGroup.value : undefined;
  if (!useScenarioAI && (!override || !override.systemPrompt)) return;
      content = { useScenarioAI, override, maxHistoryMessages: this.aiGroup.value.maxHistoryMessages || 5 };
    }

    this.dialogRef.close({
      type,
      name: val.name,
      content,
      position_x: 100,
      position_y: 100,
      is_entry: !!val.is_entry,
    });
  }

  // Convenience getters
  get options() { return this.qrGroup.get('options') as FormArray; }
  get cards() { return this.carouselGroup.get('cards') as FormArray; }
  get fields() { return this.formNodeGroup.get('fields') as FormArray; }
  get actions() { return this.actionGroup.get('actions') as FormArray; }

  // Options
  addOption() { this.options.push(this.fb.group({ title: ['', [Validators.required, Validators.maxLength(30)]], nextNodeId: [null] })); }
  removeOption(i: number) { this.options.removeAt(i); }

  // Carousel manual
  addCard() { this.cards.push(this.fb.group({ title: [''], subtitle: [''], image: [''], buttons: this.fb.array([]) })); }
  removeCard(i: number) { this.cards.removeAt(i); }
  getCardButtons(ci: number) { return (this.cards.at(ci).get('buttons') as FormArray); }
  addCardButton(ci: number) { this.getCardButtons(ci).push(this.fb.group({ title: [''], nextNodeId: [null] })); }
  removeCardButton(ci: number, bi: number) { this.getCardButtons(ci).removeAt(bi); }

  // Form fields
  addField() { this.fields.push(this.fb.group({ key: [''], label: [''], type: ['text'], required: [false] })); }
  removeField(i: number) { this.fields.removeAt(i); }

  // Actions
  addAction() { this.actions.push(this.fb.group({ type: ['add_tag'], value: [''], key: [''], url: [''], method: ['POST'], headers: [''], body: [''] })); }
  removeAction(i: number) { this.actions.removeAt(i); }
  onActionTypeChange(_i: number) { /* adjust validation if needed */ }
}
