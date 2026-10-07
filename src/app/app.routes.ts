// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { SellerListComponent } from './component/seller-list/seller-list';
import { HomeComponent } from './component/home/home';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Startseite | Honey Management' },
  { path: 'sellers', component: SellerListComponent, title: 'Verkäufer | Honey Management' },
  { path: '**', redirectTo: '' }
];