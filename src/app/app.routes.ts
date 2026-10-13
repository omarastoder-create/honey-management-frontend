// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { SellerListComponent } from './component/seller-list/seller-list';
import { CustomerListComponent } from './component/customer-list/customer-list';
import { HomeComponent } from './component/home/home';
import { ProductList } from './component/product-list/product-list';
import { TransactionListComponent } from './component/transaction-list/transaction-list';
import { TransactionCreateComponent } from './component/transaction-create/transaction-create';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Startseite | Honey Management' },
  { path: 'sellers', component: SellerListComponent, title: 'Verkäufer | Honey Management'},
  {path: 'customers',component: CustomerListComponent, title: 'Kunden | Honey Management'},
  {path: 'products', component: ProductList, title: 'Produkte | Honey Management'},
  { path: 'transactions', component: TransactionListComponent, title: 'Historie | Honey Management' },
  { path: 'transactions/new', component: TransactionCreateComponent, title: 'Neuer Verkauf | Honey Management' },
  { path: '**', redirectTo: '' }
];