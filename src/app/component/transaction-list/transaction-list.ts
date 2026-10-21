import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Gift, LucideAngularModule, Plus, Printer, Receipt, Search } from 'lucide-angular';
import { avatarTone, initials, matchesSearch } from '../../core/format';
import { errorMessage } from '../../core/http-error';
import { SaleTransactionResponse, TransactionService } from '../../services/transaction.service';

type Period = 'all' | 'month' | 'year';

@Component({
  selector: 'app-transaction-list',
  imports: [CurrencyPipe, DatePipe, SlicePipe, RouterLink, LucideAngularModule],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.scss'
})
export class TransactionListComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);

  protected readonly transactions = signal<SaleTransactionResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly period = signal<Period>('all');
  protected readonly selectedTransaction = signal<SaleTransactionResponse | null>(null);

  protected readonly icons = { search: Search, print: Printer, gift: Gift, plus: Plus, receipt: Receipt };
  protected readonly initials = initials;
  protected readonly avatarTone = avatarTone;

  protected readonly filtered = computed(() => {
    const now = new Date();
    return this.transactions().filter(tx => {
      const date = new Date(tx.saleDate);
      const inPeriod =
        this.period() === 'all' ||
        (date.getFullYear() === now.getFullYear() && (this.period() === 'year' || date.getMonth() === now.getMonth()));
      return inPeriod && matchesSearch(
        this.search(),
        tx.customerName,
        tx.sellerName,
        tx.transactionId,
        ...tx.items.map(i => i.productDescription)
      );
    });
  });

  protected readonly revenue = computed(() => this.filtered().reduce((sum, tx) => sum + tx.totalPrice, 0));
  protected readonly average = computed(() => (this.filtered().length ? this.revenue() / this.filtered().length : 0));
  protected readonly unitsSold = computed(() =>
    this.filtered().reduce((sum, tx) => sum + tx.items.reduce((s, i) => s + i.units, 0), 0)
  );

  ngOnInit(): void {
    this.transactionService.getAllTransactions().subscribe({
      next: data => {
        this.transactions.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(errorMessage(err, 'Verkäufe konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  protected printReceipt(tx: SaleTransactionResponse): void {
    this.selectedTransaction.set(tx);
    // Give Angular a moment to render the receipt before opening the print dialog.
    setTimeout(() => window.print(), 100);
  }
}
