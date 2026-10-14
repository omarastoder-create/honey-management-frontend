// src/app/component/transaction-list/transaction-list.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TransactionResponse, TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.scss'
})
export class TransactionListComponent implements OnInit {

  private readonly transactionService = inject(TransactionService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly transactions = signal<TransactionResponse[]>([]);
  readonly selectedTransaction = signal<TransactionResponse | null>(null);

  // Berechnet den Gesamtumsatz reaktiv und ohne redundante Methodenaufrufe im Template
  readonly totalRevenue = computed(() =>
    this.transactions().reduce((sum, tx) => sum + (tx.totalPrice ?? 0), 0)
  );

  ngOnInit(): void {
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.transactionService.getAllTransactions().subscribe({
      next: (data) => this.transactions.set(data),
      error: (err) => console.error('Fehler beim Laden der Transaktionen:', err)
    });
  }

  printReceipt(transaction: TransactionResponse): void {
    this.selectedTransaction.set(transaction);
    // Synchronisiert das DOM sofort, bevor der Browser den Print-Snapshot erstellt
    this.cdr.detectChanges();
    window.print();
  }
}