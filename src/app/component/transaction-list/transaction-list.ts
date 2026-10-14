// src/app/component/transaction-list/transaction-list.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleTransactionResponse, TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.scss'
})
export class TransactionListComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);

  readonly transactions = signal<SaleTransactionResponse[]>([]);
  readonly selectedTransaction = signal<SaleTransactionResponse | null>(null);

  readonly totalRevenue = computed(() =>
    this.transactions().reduce((sum, tx) => sum + (tx.totalPrice ?? 0), 0)
  );

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.transactionService.getAllTransactions().subscribe({
      next: (data) => this.transactions.set(data),
      error: (err) => console.error('Fehler beim Laden der Verkaufshistorie:', err)
    });
  }

  printReceipt(tx: SaleTransactionResponse): void {
    this.selectedTransaction.set(tx);
    // Kurzer Timeout gibt Angular Zeit, den @if-Block für den Druckbeleg ins DOM zu rendern
    setTimeout(() => {
      window.print();
    }, 100);
  }
}