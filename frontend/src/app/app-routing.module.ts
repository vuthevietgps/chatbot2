import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './auth/login/login.component';
import { UsersComponent } from './pages/users/users.component';
import { ProductGroupsComponent } from './pages/product-groups/product-groups.component';
import { FanpagesComponent } from './pages/fanpages/fanpages.component';
import { ProductsComponent } from './pages/products/products.component';
import { ScriptGroupsComponent } from './pages/script-groups/script-groups.component';
import { ScriptsComponent } from './pages/scripts/scripts.component';
import { ApiTokenComponent } from './pages/api-token/api-token.component';
import { ConversationsComponent } from './pages/conversations/conversations.component';
import { MessagesComponent } from './pages/messages/messages.component';
import { ScenarioDetailsPageComponent } from './pages/scenarios/scenario-details-page.component';
import { SubScriptsComponent } from './pages/sub-scripts/sub-scripts.component';
import { CustomersComponent } from './pages/customers/customers.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
    { path: 'users', component: UsersComponent },
  { path: 'fanpages', component: FanpagesComponent },
  { path: 'conversations', component: ConversationsComponent },
  { path: 'messages/:id', component: MessagesComponent },
  { path: 'scenarios/:id', component: ScenarioDetailsPageComponent },
  { path: 'product-groups', component: ProductGroupsComponent },
    { path: 'products', component: ProductsComponent },
  { path: 'chatscripts', component: ScriptGroupsComponent },
  { path: 'scripts', component: ScriptsComponent },
  { path: 'sub-scripts', component: SubScriptsComponent },
  { path: 'api-token', component: ApiTokenComponent },
  { path: 'customers', component: CustomersComponent },
  { 
    path: 'openai-config', 
    loadChildren: () => import('./pages/openai-config/openai-config.module').then(m => m.OpenaiConfigModule)
  },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}