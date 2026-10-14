// src/app/services/transaction.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TransactionItemRequest {
  readonly productId: string;
  readonly quantity: number;
  readonly customPricePerUnit: number | null;
  readonly isGift: boolean;
}

export interface SaleTransactionRequest {
  readonly sellerId: string;
  readonly customerId: string;
  readonly items: readonly TransactionItemRequest[];
}

export interface TransactionItemResponse {
  readonly itemId: string;
  readonly productId: string;
  readonly productDescription: string;
  readonly units: number;
  readonly pricePerUnit: number;
  readonly subtotalPrice: number;
  readonly subTotal?: number; // Abwärtskompatibel für dein Template
  readonly isGift: boolean;
}

export interface SaleTransactionResponse {
  readonly transactionId: string;
  readonly saleDate: string;
  readonly sellerName: string;
  readonly customerName: string;
  readonly totalPrice: number;
  readonly items: readonly TransactionItemResponse[];
}

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

  createSaleTransaction(request: SaleTransactionRequest): Observable<SaleTransactionResponse> {
    return this.http.post<SaleTransactionResponse>(this.apiUrl, request);
  }
}