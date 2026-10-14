// src/app/services/transaction.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TransactionItemResponse {
  readonly productDescription: string;
  readonly units: number;
  readonly pricePerUnit: number;
  readonly subTotal: number;
}

export interface SaleTransactionResponse {
  readonly transactionId: string;
  readonly saleDate: any;
  readonly sellerName: string;
  readonly customerName: string;
  readonly totalPrice: number;
  readonly items: readonly TransactionItemResponse[];
}

// Alias für die Kompatibilität mit den Importen in der transaction-list.ts
export type TransactionResponse = SaleTransactionResponse;

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/transactions';

  getAllTransactions(): Observable<SaleTransactionResponse[]> {
    return this.http.get<SaleTransactionResponse[]>(this.apiUrl);
  }

  createSaleTransaction(request: any): Observable<SaleTransactionResponse> {
    return this.http.post<SaleTransactionResponse>(this.apiUrl, request);
  }
}