import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { 
  LucideAngularModule, 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  Package, 
  TrendingDown, 
  Users, 
  UserCheck, 
  Search, 
  Hexagon 
} from 'lucide-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  readonly icons = {
    dashboard: LayoutDashboard,
    cart: ShoppingCart,
    receipt: Receipt,
    products: Package,
    expenses: TrendingDown,
    customers: Users,
    sellers: UserCheck,
    search: Search,
    logo: Hexagon
  };
}