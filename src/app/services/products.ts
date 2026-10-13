import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProductRequest {
    description: string;
    pricePerUnit: number;
    unitsToSell: number;
    dateOfHarvest: string; 
}

export interface ProductResponse {
    productId: string;
    description: string;
    pricePerUnit: number;
    unitsToSell: number;
    dateOfHarvest: string; 
    imageUrl: string | null; // NEU: Nimmt den Bild-Pfad vom Backend auf
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

    // GEÄNDERT: Erwartet FormData statt ProductRequest
    createProduct(formData: FormData): Observable<ProductResponse> {
        return this.http.post<ProductResponse>(this.apiUrl, formData);
    }
}