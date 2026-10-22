import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api';

export interface CustomerResponse {
  readonly customerId: string;
  readonly name: string;
  readonly familyName: string;
  readonly description: string | null;
  readonly phoneNumber: string;
  readonly email: string | null;
}

export interface CustomerRequest {
  readonly name: string;
  readonly familyName: string;
  readonly description: string | null;
  readonly phoneNumber: string;
  readonly email: string | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly url = apiUrl('customers');

  getAllCustomers(): Observable<CustomerResponse[]> {
    return this.http.get<CustomerResponse[]>(this.url);
  }

  createCustomer(request: CustomerRequest): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(this.url, request);
  }

  updateCustomer(id: string, request: CustomerRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.url}/${id}`, request);
  }
}
