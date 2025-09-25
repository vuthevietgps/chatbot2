import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ScenariosService, ScenarioMeta, Trigger, Node as ScenarioNode, Link as ScenarioLink, Variable as ScenarioVar, AIRuntimeConfig, TestRunRequest, TestRunResult } from '../../services/scenarios.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TriggerDialogComponent } from './trigger-dialog.component';
import { VariableDialogComponent } from './variable-dialog.component';
import { NodeDialogComponent } from './node-dialog.component';
import { OpenAIConfigService, OpenAIConfig } from '../../services/openai-config.service';
import { OpenAIConfigFormComponent } from '../openai-config/openai-config-form/openai-config-form.component';

@Component({
  selector: 'app-scenario-details-page',
  template: `
    <div class="page-container">
      <div class="breadcrumb">Kịch bản Chat / {{ name || 'Chi tiết' }}</div>

      <div class="header">
        <button mat-stroked-button color="primary" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Quay lại
        </button>
        <h2 class="title">{{ scenario?.name || name || 'Chi tiết kịch bản' }}</h2>
      </div>

      <mat-tab-group>
        <!-- Overview Tab -->
        <mat-tab label="Tổng quan">
          <div class="tab">
            <div class="overview-grid" *ngIf="scenario">
              <div><strong>Tên:</strong> {{ scenario.name }}</div>
              <div><strong>Mô tả:</strong> {{ scenario.description || '-' }}</div>
              <div><strong>Fanpage:</strong> {{ scenario.page_id }}</div>
              <div><strong>Nhóm SP:</strong> {{ scenario.product_group_id || '-' }}</div>
              <div><strong>Trạng thái:</strong> {{ scenario.status }}</div>
              <div><strong>Ưu tiên:</strong> {{ scenario.priority }}</div>
              <div><strong>AI:</strong> {{ scenario.ai_enabled ? 'Bật' : 'Tắt' }}</div>
              <div><strong>Version:</strong> {{ scenario.published_version ?? 0 }}</div>
            </div>
            <div class="actions">
              <button mat-flat-button color="primary" (click)="openEditMeta()"><mat-icon>edit</mat-icon> Chỉnh sửa</button>
            </div>
          </div>
        </mat-tab>

        <!-- Triggers Tab -->
        <mat-tab label="Trigger">
          <div class="tab">
            <div class="actions"><button mat-stroked-button color="primary" (click)="addTrigger()"><mat-icon>add</mat-icon> Thêm Trigger</button></div>
            <table class="simple-table" *ngIf="triggers.length">
              <thead><tr><th>Loại</th><th>Giá trị</th><th>So khớp</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
              <tbody>
                <tr *ngFor="let t of triggers">
                  <td>{{ t.type }}</td>
                  <td>{{ t.value }}</td>
                  <td>{{ t.match_mode }}</td>
                  <td>
                    <mat-chip-set><mat-chip [color]="t.is_active ? 'primary' : undefined">{{ t.is_active ? 'bật' : 'tắt' }}</mat-chip></mat-chip-set>
                  </td>
                  <td>
                    <button mat-icon-button (click)="editTrigger(t)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" (click)="deleteTrigger(t)"><mat-icon>delete</mat-icon></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="!triggers.length" class="muted">Chưa có trigger nào.</div>
          </div>
        </mat-tab>

        <!-- Flow Tab -->
        <mat-tab label="Flow">
          <div class="tab">
            <div class="actions">
              <button mat-stroked-button color="primary" (click)="addNode()"><mat-icon>add</mat-icon> Thêm Node</button>
              <button mat-button (click)="autoArrange()"><mat-icon>auto_fix_high</mat-icon> Auto-Arrange</button>
            </div>
            <div class="canvas" (mousedown)="onCanvasMouseDown($event)" (mouseup)="onCanvasMouseUp($event)">
              <!-- Links -->
              <svg class="links-layer">
                <ng-container *ngFor="let l of links">
                  <line [attr.x1]="getNodeById(l.from_node_id)?.position_x" [attr.y1]="getNodeById(l.from_node_id)?.position_y"
                        [attr.x2]="getNodeById(l.to_node_id)?.position_x" [attr.y2]="getNodeById(l.to_node_id)?.position_y" />
                </ng-container>
                <line *ngIf="tempLink" [attr.x1]="tempLink.x1" [attr.y1]="tempLink.y1" [attr.x2]="tempLink.x2" [attr.y2]="tempLink.y2" stroke-dasharray="4 2" />
              </svg>

              <!-- Nodes -->
              <div *ngFor="let n of nodes" class="node-box" [ngStyle]="{ left: n.position_x + 'px', top: n.position_y + 'px' }"
                   (mousedown)="onNodeMouseDown($event, n)" (mouseup)="onNodeMouseUp($event, n)">
                <div class="node-header">
                  <span class="icon">📝</span>
                  <span class="label">{{ n.name }}</span>
                </div>
                <div class="node-body">{{ n.type }}</div>
                <div class="port out" (mousedown)="onPortMouseDown($event, n)"></div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Variables Tab -->
        <mat-tab label="Biến / Context">
          <div class="tab">
            <div class="actions"><button mat-stroked-button color="primary" (click)="addVariable()"><mat-icon>add</mat-icon> Thêm biến</button></div>
            <table class="simple-table" *ngIf="variables.length">
              <thead><tr><th>Key</th><th>Kiểu</th><th>Giá trị mặc định</th><th>Hành động</th></tr></thead>
              <tbody>
                <tr *ngFor="let v of variables">
                  <td>{{ v.key }}</td>
                  <td>{{ v.type }}</td>
                  <td><code>{{ v.default_value | json }}</code></td>
                  <td>
                    <button mat-icon-button (click)="editVariable(v)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" (click)="deleteVariable(v)"><mat-icon>delete</mat-icon></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="!variables.length" class="muted">Chưa có biến.</div>
          </div>
        </mat-tab>

        <!-- AI Tab -->
        <mat-tab label="AI">
          <div class="tab">
            <div class="ai-config-section">
              <!-- AI Enable/Disable -->
              <div class="ai-toggle">
                <mat-slide-toggle [ngModel]="scenario?.ai_enabled" (change)="updateAIEnabled($event)">
                  <strong>Kích hoạt AI cho kịch bản này</strong>
                </mat-slide-toggle>
                <p class="ai-description">
                  Khi bật AI, hệ thống sẽ sử dụng OpenAI để trả lời những tin nhắn không khớp với script.
                </p>
              </div>

              <!-- OpenAI Config Selection -->
              <div class="ai-config-selection" *ngIf="scenario?.ai_enabled">
                <h3>Cấu hình OpenAI</h3>
                
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Chọn cấu hình OpenAI</mat-label>
                  <mat-select [ngModel]="selectedOpenAIConfig?._id" (selectionChange)="onOpenAIConfigChange($event.value)">
                    <mat-option value="">Sử dụng cấu hình mặc định</mat-option>
                    <mat-option *ngFor="let config of availableOpenAIConfigs" [value]="config._id">
                      <div class="config-option">
                        <span class="config-name">{{ config.name }}</span>
                        <span class="config-model">{{ config.model }}</span>
                        <mat-chip class="config-status" [color]="config.status === 'active' ? 'primary' : 'warn'" selected>
                          {{ config.status === 'active' ? 'Hoạt động' : 'Tạm dừng' }}
                        </mat-chip>
                      </div>
                    </mat-option>
                  </mat-select>
                  <mat-hint>Bạn có thể quản lý cấu hình OpenAI trong menu "Cấu hình OpenAI"</mat-hint>
                </mat-form-field>

                <!-- Selected Config Preview -->
                <div class="selected-config-preview" *ngIf="selectedOpenAIConfig">
                  <h4>Cấu hình đã chọn</h4>
                  <div class="config-details">
                    <div class="config-item">
                      <strong>Tên:</strong> {{ selectedOpenAIConfig.name }}
                    </div>
                    <div class="config-item">
                      <strong>Model:</strong> {{ selectedOpenAIConfig.model }}
                    </div>
                    <div class="config-item">
                      <strong>Temperature:</strong> {{ selectedOpenAIConfig.temperature }}
                    </div>
                    <div class="config-item">
                      <strong>Max Tokens:</strong> {{ selectedOpenAIConfig.maxTokens }}
                    </div>
                    <div class="config-item">
                      <strong>System Prompt:</strong> 
                      <span class="system-prompt">{{ selectedOpenAIConfig.systemPrompt | slice:0:100 }}{{ selectedOpenAIConfig.systemPrompt.length > 100 ? '...' : '' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Quick Actions -->
                <div class="ai-actions">
                  <button mat-stroked-button color="primary" (click)="createNewOpenAIConfig()">
                    <mat-icon>add</mat-icon>
                    Tạo cấu hình mới
                  </button>
                  <button mat-stroked-button *ngIf="selectedOpenAIConfig" (click)="testOpenAIConfig()">
                    <mat-icon>play_arrow</mat-icon>
                    Test cấu hình
                  </button>
                  <button mat-stroked-button (click)="openOpenAIManagement()">
                    <mat-icon>settings</mat-icon>
                    Quản lý cấu hình OpenAI
                  </button>
                </div>
              </div>
            </div>
            
            <div class="actions">
              <button mat-flat-button color="primary" (click)="saveAISettings()">
                <mat-icon>save</mat-icon> 
                Lưu cài đặt AI
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- Test Tab -->
        <mat-tab label="Test">
          <div class="tab">
            <div class="test-row">
              <mat-form-field class="w-100" appearance="outline">
                <mat-label>Tin nhắn khách hàng</mat-label>
                <input matInput [(ngModel)]="testInput" placeholder="Nhập tin nhắn để chạy thử">
              </mat-form-field>
              <mat-checkbox [(ngModel)]="testUseAI">Dùng AI</mat-checkbox>
              <button mat-flat-button color="primary" (click)="runTest()"><mat-icon>play_arrow</mat-icon> Gửi thử</button>
            </div>
            <div class="test-output" *ngIf="testResult">
              <h4>Kết quả</h4>
              <div><strong>Steps:</strong></div>
              <pre>{{ testResult.steps | json }}</pre>
              <div><strong>Messages:</strong></div>
              <pre>{{ testResult.messages | json }}</pre>
            </div>
          </div>
        </mat-tab>

        <!-- History Tab -->
        <mat-tab label="Lịch sử">
          <div class="tab">
            <div class="actions"><button mat-flat-button color="primary" (click)="publish()"><mat-icon>cloud_upload</mat-icon> Publish</button></div>
            <table class="simple-table" *ngIf="versions.length">
              <thead><tr><th>Version</th><th>Ngày giờ</th><th>Người publish</th><th>Hành động</th></tr></thead>
              <tbody>
                <tr *ngFor="let ver of versions">
                  <td>{{ ver.version }}</td>
                  <td>{{ ver.created_at || '-' }}</td>
                  <td>{{ ver.created_by || '-' }}</td>
                  <td>
                    <button mat-stroked-button (click)="restore(ver.version)">Khôi phục</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="!versions.length" class="muted">Chưa có version.</div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 16px; }
    .breadcrumb { color: #777; }
    .header { display: flex; align-items: center; gap: 16px; }
    .title { margin: 0; }
    .tab { padding: 16px; color: #666; }
    .overview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; }
    .actions { margin-top: 12px; display: flex; gap: 8px; }
  .canvas { position: relative; height: 520px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; overflow: hidden; }
  .links-layer { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .links-layer line { stroke: #90caf9; stroke-width: 2; }
  .node-box { position: absolute; min-width: 140px; border: 1px solid #ddd; border-radius: 6px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.08); cursor: move; user-select: none; }
  .node-header { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: #f5f5f5; border-bottom: 1px solid #eee; border-radius: 6px 6px 0 0; }
  .node-body { padding: 8px; color: #777; }
  .node-box .port.out { position: absolute; right: -6px; top: 50%; width: 12px; height: 12px; background: #42a5f5; border-radius: 50%; border: 2px solid #fff; cursor: crosshair; }
    .simple-table { width: 100%; border-collapse: collapse; }
    .simple-table th, .simple-table td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
    .muted { color: #999; font-style: italic; }
    .w-100 { width: 100%; }
    .test-row { display: flex; align-items: center; gap: 12px; }
    .test-output pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; }
    
    /* AI Configuration Styles */
    .ai-config-section { display: flex; flex-direction: column; gap: 24px; }
    .ai-toggle { padding: 16px; background: #f5f5f5; border-radius: 8px; }
    .ai-description { margin: 8px 0 0; color: #666; font-size: 0.875rem; }
    .ai-config-selection { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; }
    .ai-config-selection h3 { margin: 0 0 16px; color: #333; }
    .config-option { display: flex; align-items: center; gap: 12px; }
    .config-name { font-weight: 500; }
    .config-model { color: #666; font-size: 0.875rem; }
    .config-status { margin-left: auto; }
    .selected-config-preview { margin-top: 16px; padding: 16px; background: #f9f9f9; border-radius: 6px; }
    .selected-config-preview h4 { margin: 0 0 12px; color: #333; }
    .config-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .config-item { display: flex; gap: 8px; }
    .config-item strong { min-width: 120px; }
    .system-prompt { color: #666; font-style: italic; }
    .ai-actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
  `]
})
export class ScenarioDetailsPageComponent implements OnInit {
  id: string = '';
  name: string = '';
  scenario: ScenarioMeta | null = null;
  triggers: Trigger[] = [];
  nodes: ScenarioNode[] = [];
  links: ScenarioLink[] = [];
  variables: ScenarioVar[] = [];
  ai: AIRuntimeConfig = {};
  versions: any[] = [];
  testInput: string = '';
  testUseAI: boolean = false;
  testResult: TestRunResult | null = null;

  // OpenAI Configuration
  availableOpenAIConfigs: OpenAIConfig[] = [];
  selectedOpenAIConfig: OpenAIConfig | null = null;
  loadingConfigs = false;

  // Canvas state
  private draggingNode: { node: ScenarioNode; offsetX: number; offsetY: number } | null = null;
  tempLink: { x1: number; y1: number; x2: number; y2: number; fromNodeId?: string } | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private api: ScenariosService, private dialog: MatDialog, private snack: MatSnackBar, private openaiService: OpenAIConfigService) {
    this.route.params.subscribe(p => { this.id = p['id']; });
    const state = (history.state || {}) as any;
    this.name = state?.name || '';
    this.loadAll();
  }

  ngOnInit() {
    this.loadOpenAIConfigs();
  }

  goBack() {
    const st = (history.state || {}) as any;
    const backState = st?.table ? { state: st } : undefined;
    this.router.navigate(['/chatscripts'], backState);
  }

  // Data loading
  loadAll() {
    if (!this.id) return;
    this.api.getScenario(this.id).subscribe(s => {
      this.scenario = s;
      // Reload OpenAI configs after scenario is loaded to auto-select current config
      this.loadOpenAIConfigs();
    });
    this.api.listTriggers(this.id).subscribe(d => this.triggers = d || []);
    this.api.listNodes(this.id).subscribe(d => { this.nodes = d.nodes || []; this.links = d.links || []; });
    this.api.listVariables(this.id).subscribe(d => this.variables = d || []);
    this.api.getAI(this.id).subscribe(d => this.ai = d || {});
    this.api.listVersions(this.id).subscribe(d => this.versions = d || []);
  }

  // Overview
  openEditMeta() {
    // Open the existing ScriptGroupDialog for quick metadata edits would require bridging by id/name.
    // For now, this is a placeholder; we can implement a dedicated Scenario Meta dialog later.
  }

  // Triggers
  addTrigger() {
    const ref = this.dialog.open(TriggerDialogComponent, { width: '520px', data: {} });
    ref.afterClosed().subscribe(val => {
      if (!val || !this.id) return;
      this.api.createTrigger(this.id, val).subscribe({
        next: () => { this.snack.open('Đã thêm trigger', 'Đóng', { duration: 2000 }); this.api.listTriggers(this.id).subscribe(d => this.triggers = d || []); },
        error: () => this.snack.open('Lỗi khi thêm trigger', 'Đóng', { duration: 2500 }),
      });
    });
  }
  editTrigger(t: Trigger) {
    const ref = this.dialog.open(TriggerDialogComponent, { width: '520px', data: { trigger: t } });
    ref.afterClosed().subscribe(val => {
      if (!val) return;
      this.api.updateTrigger(t.id, val).subscribe({
        next: () => { this.snack.open('Đã cập nhật trigger', 'Đóng', { duration: 2000 }); if (this.id) this.api.listTriggers(this.id).subscribe(d => this.triggers = d || []); },
        error: () => this.snack.open('Lỗi khi cập nhật trigger', 'Đóng', { duration: 2500 }),
      });
    });
  }
  deleteTrigger(t: Trigger) {
    if (!confirm('Xóa trigger này?')) return;
    this.api.deleteTrigger(t.id).subscribe({
      next: () => { this.snack.open('Đã xóa trigger', 'Đóng', { duration: 2000 }); this.triggers = this.triggers.filter(x => x.id !== t.id); },
      error: () => this.snack.open('Lỗi khi xóa trigger', 'Đóng', { duration: 2500 }),
    });
  }

  // Flow
  addNode() {
    const ref = this.dialog.open(NodeDialogComponent, { width: '560px', data: { nodes: this.nodes } });
    ref.afterClosed().subscribe(val => {
      if (!val || !this.id) return;
      this.api.createNode(this.id, val).subscribe({
        next: (created) => {
          this.snack.open('Đã thêm node', 'Đóng', { duration: 2000 });
          // Refresh list
          this.api.listNodes(this.id!).subscribe(d => { this.nodes = d.nodes || []; this.links = d.links || []; });
        },
        error: () => this.snack.open('Lỗi khi thêm node', 'Đóng', { duration: 2500 }),
      });
    });
  }
  autoArrange() { /* compute layout on nodes and save positions */ }

  // Canvas helpers
  getNodeById(id: string | undefined | null) { return this.nodes.find(n => n.id === id); }

  onNodeMouseDown(ev: MouseEvent, node: ScenarioNode) {
    ev.stopPropagation();
    const target = ev.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.draggingNode = {
      node,
      offsetX: ev.clientX - rect.left,
      offsetY: ev.clientY - rect.top,
    };
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
  }

  onMouseMove = (ev: MouseEvent) => {
    if (this.draggingNode) {
      this.draggingNode.node.position_x = ev.clientX - this.draggingNode.offsetX - this.canvasLeft();
      this.draggingNode.node.position_y = ev.clientY - this.draggingNode.offsetY - this.canvasTop();
    }
    if (this.tempLink) {
      this.tempLink.x2 = ev.clientX - this.canvasLeft();
      this.tempLink.y2 = ev.clientY - this.canvasTop();
    }
  };

  onWindowMouseUp = (_: MouseEvent) => {
    if (this.draggingNode) {
      const n = this.draggingNode.node;
      // Persist position
      this.api.updateNode(n.id, { position_x: n.position_x, position_y: n.position_y }).subscribe();
    }
    this.draggingNode = null;
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  };

  onNodeMouseUp(ev: MouseEvent, node: ScenarioNode) {
    ev.stopPropagation();
    if (this.tempLink && this.tempLink.fromNodeId && this.id) {
      // Create link from fromNodeId to this node
      this.api.createLink(this.id, { from_node_id: this.tempLink.fromNodeId, to_node_id: node.id, condition: null, order_index: 0 }).subscribe({
        next: () => { this.api.listNodes(this.id!).subscribe(d => { this.nodes = d.nodes || []; this.links = d.links || []; }); },
      });
    }
    this.tempLink = null;
  }

  onPortMouseDown(ev: MouseEvent, node: ScenarioNode) {
    ev.stopPropagation();
    const canvasRect = this.getCanvasRect();
    this.tempLink = { x1: node.position_x, y1: node.position_y, x2: ev.clientX - canvasRect.left, y2: ev.clientY - canvasRect.top, fromNodeId: node.id };
  }

  onCanvasMouseDown(_ev: MouseEvent) { /* reserve for selection */ }
  onCanvasMouseUp(_ev: MouseEvent) { this.tempLink = null; }

  private getCanvasEl(): HTMLElement | null { return document.querySelector('.canvas'); }
  private getCanvasRect() { return this.getCanvasEl()?.getBoundingClientRect() ?? new DOMRect(0,0,0,0); }
  private canvasLeft() { return this.getCanvasRect().left; }
  private canvasTop() { return this.getCanvasRect().top; }

  // Variables
  addVariable() {
    const ref = this.dialog.open(VariableDialogComponent, { width: '520px', data: {} });
    ref.afterClosed().subscribe(val => {
      if (!val || !this.id) return;
      this.api.createVariable(this.id, val).subscribe({
        next: () => { this.snack.open('Đã thêm biến', 'Đóng', { duration: 2000 }); this.api.listVariables(this.id).subscribe(d => this.variables = d || []); },
        error: () => this.snack.open('Lỗi khi thêm biến', 'Đóng', { duration: 2500 }),
      });
    });
  }
  editVariable(v: ScenarioVar) {
    const ref = this.dialog.open(VariableDialogComponent, { width: '520px', data: { variable: v } });
    ref.afterClosed().subscribe(val => {
      if (!val) return;
      this.api.updateVariable(v.id, val).subscribe({
        next: () => { this.snack.open('Đã cập nhật biến', 'Đóng', { duration: 2000 }); if (this.id) this.api.listVariables(this.id).subscribe(d => this.variables = d || []); },
        error: () => this.snack.open('Lỗi khi cập nhật biến', 'Đóng', { duration: 2500 }),
      });
    });
  }
  deleteVariable(v: ScenarioVar) {
    if (!confirm('Xóa biến này?')) return;
    this.api.deleteVariable(v.id).subscribe({
      next: () => { this.snack.open('Đã xóa biến', 'Đóng', { duration: 2000 }); this.variables = this.variables.filter(x => x.id !== v.id); },
      error: () => this.snack.open('Lỗi khi xóa biến', 'Đóng', { duration: 2500 }),
    });
  }

  // AI
  saveAI() { if (!this.id) return; this.api.updateAI(this.id, this.ai).subscribe(() => {}); }

  // OpenAI Config Management
  loadOpenAIConfigs() {
    this.loadingConfigs = true;
    this.openaiService.getConfigs().subscribe({
      next: (response) => {
        this.availableOpenAIConfigs = response.data;
        this.loadingConfigs = false;
        // Auto-select current config if exists
        if (this.ai?.openai_config_id) {
          this.selectedOpenAIConfig = response.data.find((c: OpenAIConfig) => c._id === this.ai!.openai_config_id) || null;
        } else if (this.scenario?.openai_config_id) {
          this.selectedOpenAIConfig = response.data.find((c: OpenAIConfig) => c._id === this.scenario!.openai_config_id) || null;
        }
      },
      error: (err: any) => {
        console.error('Error loading OpenAI configs:', err);
        this.loadingConfigs = false;
        this.snack.open('Lỗi khi tải cấu hình OpenAI', 'Đóng', { duration: 3000 });
      }
    });
  }

  onOpenAIConfigChange(configId: string) {
    this.selectedOpenAIConfig = this.availableOpenAIConfigs.find((c: OpenAIConfig) => c._id === configId) || null;
    if (this.selectedOpenAIConfig && this.scenario) {
      // Update scenario with selected OpenAI config
      this.scenario.openai_config_id = configId;
      this.api.updateScenario(this.scenario.id, { openai_config_id: configId }).subscribe({
        next: () => {
          this.snack.open('Đã cập nhật cấu hình OpenAI', 'Đóng', { duration: 2000 });
        },
        error: () => {
          this.snack.open('Lỗi khi cập nhật cấu hình OpenAI', 'Đóng', { duration: 2500 });
        }
      });
    }
  }

  openOpenAIManagement() {
    // Navigate to OpenAI management page
    this.router.navigate(['/openai-config']);
  }

  createNewOpenAIConfig() {
    const dialogRef = this.dialog.open(OpenAIConfigFormComponent, {
      width: '600px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOpenAIConfigs(); // Reload configs after creation
      }
    });
  }

  updateAIEnabled(event?: any) {
    if (!this.scenario) return;
    
    // Update local value from event if provided
    if (event && event.checked !== undefined) {
      this.scenario.ai_enabled = event.checked;
    }
    
    // Save AI enabled status
    this.api.updateScenario(this.scenario.id, { ai_enabled: this.scenario.ai_enabled }).subscribe({
      next: () => {
        this.snack.open('Đã cập nhật trạng thái AI', 'Đóng', { duration: 2000 });
      },
      error: () => {
        this.snack.open('Lỗi khi cập nhật trạng thái AI', 'Đóng', { duration: 2500 });
      }
    });
  }

  testOpenAIConfig() {
    if (!this.selectedOpenAIConfig || !this.selectedOpenAIConfig._id) return;
    
    this.openaiService.testConfig(this.selectedOpenAIConfig._id).subscribe({
      next: (result) => {
        if (result.success) {
          this.snack.open(`Test thành công! Phản hồi: ${result.response?.substring(0, 100)}...`, 'Đóng', { duration: 5000 });
        } else {
          this.snack.open(`Test thất bại: ${result.error}`, 'Đóng', { duration: 5000 });
        }
      },
      error: (err) => {
        console.error('Test config error:', err);
        this.snack.open('Lỗi khi test cấu hình OpenAI', 'Đóng', { duration: 3000 });
      }
    });
  }

  saveAISettings() {
    if (!this.scenario || !this.selectedOpenAIConfig) return;
    
    // Update scenario with selected OpenAI config
    const updateData = {
      ai_enabled: this.scenario.ai_enabled,
      openai_config_id: this.selectedOpenAIConfig._id
    };
    
    this.api.updateScenario(this.scenario.id, updateData).subscribe({
      next: () => {
        this.snack.open('Đã lưu cài đặt AI', 'Đóng', { duration: 2000 });
      },
      error: () => {
        this.snack.open('Lỗi khi lưu cài đặt AI', 'Đóng', { duration: 2500 });
      }
    });
  }

  // Test
  runTest() { if (!this.id) return; const req: TestRunRequest = { message: this.testInput, simulate: true, useAI: this.testUseAI }; this.api.testRun(this.id, req).subscribe(res => this.testResult = res); }

  // Versions
  publish() { if (!this.id) return; this.api.publish(this.id).subscribe(() => this.api.listVersions(this.id).subscribe(d => this.versions = d || [])); }
  restore(version: number) { if (!this.id) return; this.api.restoreVersion(this.id, version).subscribe(() => this.loadAll()); }
}
