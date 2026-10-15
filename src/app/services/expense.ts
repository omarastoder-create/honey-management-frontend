// src/app/services/expense.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ExpenseResponse {
  readonly expenseId: string;
  readonly title: string;
  readonly supplierName: string;
  readonly expenseDate: string;
  readonly amount: number;
  readonly receiptImagePath?: string;
}

export interface ExpenseRequest {
  readonly title: string;
  readonly supplierName?: string;
  readonly expenseDate: string;
  readonly amount: number;
  readonly receiptImagePath?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/expenses';

  getAllExpenses(): Observable<ExpenseResponse[]> {
    return this.http.get<ExpenseResponse[]>(this.apiUrl);
  }

  createExpense(request: ExpenseRequest): Observable<ExpenseResponse> {
    return this.http.post<ExpenseResponse>(this.apiUrl, request);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}