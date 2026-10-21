import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api';

export interface ExpenseResponse {
  readonly expenseId: string;
  readonly title: string;
  readonly supplierName: string | null;
  readonly expenseDate: string;
  readonly amount: number;
  /** e.g. /receipts/<uuid>.pdf - load it with fileUrl() */
  readonly receiptUrl: string | null;
}

export interface ExpenseRequest {
  readonly title: string;
  readonly supplierName: string | null;
  readonly expenseDate: string;
  readonly amount: number;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly url = apiUrl('expenses');

  getAllExpenses(): Observable<ExpenseResponse[]> {
    return this.http.get<ExpenseResponse[]>(this.url);
  }

  createExpense(request: ExpenseRequest): Observable<ExpenseResponse> {
    return this.http.post<ExpenseResponse>(this.url, request);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Uploads or replaces the receipt (PDF or photo) of an expense. */
  uploadReceipt(id: string, file: File): Observable<ExpenseResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.put<ExpenseResponse>(`${this.url}/${id}/receipt`, form);
  }

  deleteReceipt(id: string): Observable<ExpenseResponse> {
    return this.http.delete<ExpenseResponse>(`${this.url}/${id}/receipt`);
  }
}
