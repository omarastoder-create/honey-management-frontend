import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CustomerResponse {
  customerId: string;
  name: string;
  familyName: string;
  description: string;
  phoneNumber: string;  
}

export interface CustomerRequest {
    name: string;
    familyName: string;
    description: string;
    phoneNumber: string;  
    }           
@Injectable({
 providedIn: 'root'
})

export class CustomerService {
    private readonly apiUrl = 'http://localhost:8080/api/v1/customers';
    constructor(private http: HttpClient) {}

    getAllCustomers(): Observable<CustomerResponse[]> {
        return this.http.get<CustomerResponse[]>(this.apiUrl);
    }

    createCustomer(request: CustomerRequest): Observable<CustomerResponse> {
        return this.http.post<CustomerResponse>(this.apiUrl, request);
    }
}
