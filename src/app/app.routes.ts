import { Routes } from '@angular/router';

// Every page is loaded lazily: the browser only downloads a page when it is opened.
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Dashboard · HoneyApp',
    loadComponent: () => import('./component/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'transactions/new',
    title: 'Neuer Verkauf · HoneyApp',
    loadComponent: () => import('./component/transaction-create/transaction-create').then(m => m.TransactionCreateComponent)
  },
  {
    path: 'transactions',
    title: 'Verkäufe · HoneyApp',
    loadComponent: () => import('./component/transaction-list/transaction-list').then(m => m.TransactionListComponent)
  },
  {
    path: 'products',
    title: 'Produkte · HoneyApp',
    loadComponent: () => import('./component/product-list/product-list').then(m => m.ProductListComponent)
  },
  {
    path: 'expenses',
    title: 'Ausgaben · HoneyApp',
    loadComponent: () => import('./component/expense-list/expense-list').then(m => m.ExpenseListComponent)
  },
  {
    path: 'customers',
    title: 'Kunden · HoneyApp',
    loadComponent: () => import('./component/customer-list/customer-list').then(m => m.CustomerListComponent)
  },
  {
    path: 'sellers',
    title: 'Verkäufer · HoneyApp',
    loadComponent: () => import('./component/seller-list/seller-list').then(m => m.SellerListComponent)
  },
  { path: '**', redirectTo: '' }
];
