// src/app/services/seller.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SellerResponse {// need to write the DTOs
  sellerId: string;
  name: string;
}

export interface SellerRequest {//same here 
  name: string;
}

@Injectable({
  providedIn: 'root'
})

export class SellerService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/sellers';

  constructor(private http: HttpClient) {}

  getAllSellers(): Observable<SellerResponse[]> {
    return this.http.get<SellerResponse[]>(this.apiUrl);
  }

  createSeller(request: SellerRequest): Observable<SellerResponse> {
    return this.http.post<SellerResponse>(this.apiUrl, request);
  }
}