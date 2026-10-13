import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProductRequest {
    description: string;
    pricePerUnit: number;
    unitsToSell: number;
    dateOfHarvest: string; // Geändert zu string
}

export interface ProductResponse {
    productId: string;
    description: string;
    pricePerUnit: number;
    unitsToSell: number;
    dateOfHarvest: string; // Geändert zu string
    imageUrl: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private readonly apiUrl = 'http://localhost:8080/api/v1/products';
    private readonly http = inject(HttpClient);
    
    getAllProducts(): Observable<ProductResponse[]> {
        return this.http.get<ProductResponse[]>(this.apiUrl);
    }

  createProduct(formData: FormData): Observable<ProductResponse> {
  return this.http.post<ProductResponse>(this.apiUrl, formData);
}
}