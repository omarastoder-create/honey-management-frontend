import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api';

export interface SellerResponse {
  readonly sellerId: string;
  readonly name: string;
}

export interface SellerRequest {
  readonly name: string;
}

@Injectable({ providedIn: 'root' })
export class SellerService {
  private readonly http = inject(HttpClient);
  private readonly url = apiUrl('sellers');

  getAllSellers(): Observable<SellerResponse[]> {
    return this.http.get<SellerResponse[]>(this.url);
  }

  createSeller(request: SellerRequest): Observable<SellerResponse> {
    return this.http.post<SellerResponse>(this.url, request);
  }
}
