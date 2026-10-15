import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { LucideAngularModule, DollarSign, TrendingUp, TrendingDown, Users, Award, ShoppingBag } from 'lucide-angular';
import { ProductResponse, ProductService } from '../../services/products';
import { StatisticsService } from '../../services/statistics';
import { DashboardStatisticsResponse } from '../../models/statistics.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {

  private readonly productService = inject(ProductService);
  private readonly statisticsService = inject(StatisticsService);
  
  readonly products = signal<ProductResponse[]>([]);
  readonly stats = signal<DashboardStatisticsResponse | null>(null);
  readonly isLoadingStats = signal<boolean>(true);

  readonly icons = {
    revenue: DollarSign,
    profit: TrendingUp,
    expenses: TrendingDown,
    customers: Users,
    sellers: Award,
    sales: ShoppingBag
  };

  ngOnInit(): void {
    this.loadProducts();
    this.loadStatistics();
  }

  private loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => this.products.set(data),
      error: (err) => console.error('Fehler beim Laden der Dashboard-Produkte:', err)
    });
  }

  private loadStatistics(): void {
    this.statisticsService.getStatistics().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoadingStats.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Statistiken:', err);
        this.isLoadingStats.set(false);
      }
    });
  }
}