import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api';

export interface TransactionItemRequest {
  readonly productId: string;
  readonly quantity: number;
  /** null = use the product's normal price */
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

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly url = apiUrl('transactions');

  getAllTransactions(): Observable<SaleTransactionResponse[]> {
    return this.http.get<SaleTransactionResponse[]>(this.url);
  }

  createSaleTransaction(request: SaleTransactionRequest): Observable<SaleTransactionResponse> {
    return this.http.post<SaleTransactionResponse>(this.url, request);
  }
}
