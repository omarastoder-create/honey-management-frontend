import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ArrowRight,
  Boxes,
  CircleAlert,
  Crown,
  Gift,
  LucideAngularModule,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-angular';
import { fileUrl } from '../../core/api';
import { avatarTone, initials } from '../../core/format';
import { errorMessage } from '../../core/http-error';
import { LOW_STOCK_THRESHOLD, ProductResponse, ProductService } from '../../services/product.service';
import { DashboardStatisticsResponse, PerformerStat, StatisticsService } from '../../services/statistics.service';
import { SaleTransactionResponse, TransactionService } from '../../services/transaction.service';

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, DatePipe, RouterLink, LucideAngularModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  private readonly statisticsService = inject(StatisticsService);
  private readonly productService = inject(ProductService);
  private readonly transactionService = inject(TransactionService);

  protected readonly stats = signal<DashboardStatisticsResponse | null>(null);
  protected readonly products = signal<ProductResponse[]>([]);
  protected readonly transactions = signal<SaleTransactionResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly leaderPeriod = signal<'month' | 'year'>('month');

  protected readonly icons = {
    revenue: TrendingUp, expenses: TrendingDown, profit: Wallet, stock: Boxes, plus: Plus,
    arrow: ArrowRight, crown: Crown, receipt: Receipt, alert: CircleAlert, gift: Gift
  };

  protected readonly now = new Date();
  protected readonly greeting = this.greetingFor(this.now.getHours());
  protected readonly lowStockThreshold = LOW_STOCK_THRESHOLD;
  protected readonly initials = initials;
  protected readonly avatarTone = avatarTone;
  protected readonly fileUrl = fileUrl;

  protected readonly recentSales = computed(() => this.transactions().slice(0, 5));

  protected readonly unitsInStock = computed(() => this.products().reduce((sum, p) => sum + p.unitsToSell, 0));

  protected readonly lowStockCount = computed(
    () => this.products().filter(p => p.unitsToSell <= LOW_STOCK_THRESHOLD).length
  );

  /** Products with the least stock first - those need attention. */
  protected readonly stockList = computed(() =>
    [...this.products()].sort((a, b) => a.unitsToSell - b.unitsToSell).slice(0, 6)
  );

  protected readonly maxStock = computed(() => Math.max(1, ...this.products().map(p => p.unitsToSell)));

  /** Revenue per month of the current year, Jan-Dec, scaled for the bar chart. */
  protected readonly monthBars = computed(() => {
    const sales = this.stats()?.monthlySales ?? [];
    const revenues = MONTHS.map((_, i) => sales.find(m => m.month === i + 1)?.revenue ?? 0);
    const max = Math.max(0, ...revenues);
    return revenues.map((revenue, i) => ({
      label: MONTHS[i],
      revenue,
      // A small minimum height keeps tiny but non-zero months visible.
      percent: max > 0 ? Math.max((revenue / max) * 100, revenue > 0 ? 3 : 0) : 0,
      current: i === this.now.getMonth()
    }));
  });

  protected readonly yearRevenue = computed(() => this.monthBars().reduce((sum, m) => sum + m.revenue, 0));

  protected readonly leaders = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const month = this.leaderPeriod() === 'month';
    return [
      { role: 'Top-Kunde', stat: month ? s.topCustomerOfMonth : s.topCustomerOfYear },
      { role: 'Top-Verkäufer', stat: month ? s.topSellerOfMonth : s.topSellerOfYear }
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      stats: this.statisticsService.getStatistics(),
      products: this.productService.getAllProducts(),
      transactions: this.transactionService.getAllTransactions()
    }).subscribe({
      next: ({ stats, products, transactions }) => {
        this.stats.set(stats);
        this.products.set(products);
        this.transactions.set(transactions);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(errorMessage(err, 'Dashboard konnte nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  protected hasData(stat: PerformerStat | null | undefined): boolean {
    return !!stat && stat.totalVolume > 0;
  }

  protected itemSummary(tx: SaleTransactionResponse): string {
    return tx.items.map(i => `${i.units}× ${i.productDescription}`).join(', ');
  }

  private greetingFor(hour: number): string {
    if (hour >= 5 && hour < 11) return 'Guten Morgen';
    if (hour < 5) return 'Guten Abend';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  }
}
