import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Material Modules
import { MaterialModule } from './shared/material.module';

// Components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { LoginComponent } from './auth/login/login.component';
import { UsersComponent } from './pages/users/users.component';
import { UserDialogComponent } from './pages/users/user-dialog/user-dialog.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ProductGroupsComponent } from './pages/product-groups/product-groups.component';
import { ProductGroupDialogComponent } from './pages/product-groups/product-group-dialog.component';
import { FanpagesComponent } from './pages/fanpages/fanpages.component';
import { FanpageDialogComponent } from './pages/fanpages/fanpage-dialog.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDialogComponent } from './pages/products/product-dialog.component';
import { ScriptGroupsComponent } from './pages/script-groups/script-groups.component';
import { ScriptGroupDialogComponent } from './pages/script-groups/script-group-dialog.component';
import { ScriptsComponent } from './pages/scripts/scripts.component';
import { ScriptDialogComponent } from './pages/scripts/script-dialog.component';
import { ApiTokenComponent } from './pages/api-token/api-token.component';
import { ConversationsComponent } from './pages/conversations/conversations.component';
import { MessagesComponent } from './pages/messages/messages.component';
import { ScenarioDetailsPageComponent } from './pages/scenarios/scenario-details-page.component';
import { TriggerDialogComponent } from './pages/scenarios/trigger-dialog.component';
import { VariableDialogComponent } from './pages/scenarios/variable-dialog.component';
import { NodeDialogComponent } from './pages/scenarios/node-dialog.component';
import { SubScriptsComponent } from './pages/sub-scripts/sub-scripts.component';
import { SubScriptDialogComponent } from './pages/sub-scripts/sub-script-dialog/sub-script-dialog.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { CustomerDialogComponent } from './pages/customers/customer-dialog.component';
import { CustomerDetailComponent } from './pages/customers/customer-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    SidebarComponent,
    HeaderComponent,
    LoginComponent,
    UsersComponent,
    UserDialogComponent,
    ProductGroupsComponent,
    ProductGroupDialogComponent,
    FanpagesComponent,
    FanpageDialogComponent,
    ProductsComponent,
    ProductDialogComponent,
    ScriptGroupsComponent,
    ScriptGroupDialogComponent,
    ScriptsComponent,
    ScriptDialogComponent,
    ApiTokenComponent,
    ConversationsComponent,
    MessagesComponent,
    ScenarioDetailsPageComponent,
    TriggerDialogComponent,
    VariableDialogComponent,
    NodeDialogComponent,
    SubScriptsComponent,
    SubScriptDialogComponent,
    ConfirmDialogComponent,
    CustomersComponent,
    CustomerDialogComponent,
    CustomerDetailComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    
    // Centralized Material bundle
    MaterialModule
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }