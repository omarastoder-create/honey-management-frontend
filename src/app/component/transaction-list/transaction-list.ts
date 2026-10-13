import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http'; // NEU
import { TransactionService } from '../../services/transaction.service';
import { SaleTransactionResponse } from '../../models/transaction';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.scss'
})
export class TransactionListComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  
  readonly transactions = signal<SaleTransactionResponse[]>([]);

  ngOnInit(): void {
    this.transactionService.getAll().subscribe({
      next: (data: SaleTransactionResponse[]) => this.transactions.set(data),
      error: (err: HttpErrorResponse) => console.error('API-Fehler:', err.message)
    });
  }
}