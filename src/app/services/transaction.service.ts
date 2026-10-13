import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SaleTransactionResponse, TransactionRequest } from '../models/transaction';

@Injectable({
    providedIn: 'root'
})

export class TransactionService {
    private readonly apiUrl = 'http://localhost:8080/api/v1/transactions';

    private readonly http = inject(HttpClient);

    getAll(): Observable<SaleTransactionResponse[]> {
        return this.http.get<SaleTransactionResponse[]>(this.apiUrl);
    }

    create(request: TransactionRequest): Observable<SaleTransactionResponse> {
        return this.http.post<SaleTransactionResponse>(this.apiUrl, request);
    }   


}
