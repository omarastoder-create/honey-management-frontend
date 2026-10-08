import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Service } from '@angular/core';
import { Observable } from 'rxjs';

@Service()
export class Products {}

export interface ProductRequest {
    description: string;
    pricePerUnit: number;
    unitsToSell: number;
    dateOfHarvest: Date;
    }

export interface ProductResponse {
    productId: string;
    description: string;
    pricePerUnit: number;
    unitsToSell: number;
    dateOfHarvest: Date;
    }

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private readonly apiUrl = 'http://localhost:8080/api/v1/products';

    constructor(private http: HttpClient) {}
    
    getAllProducts(): Observable<ProductResponse[]> {
        return this.http.get<ProductResponse[]>(this.apiUrl);
    }

    createProduct(request: ProductRequest): Observable<ProductResponse> {
        return this.http.post<ProductResponse>(this.apiUrl, request);
    }
}

