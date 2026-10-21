import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api';

export interface ProductRequest {
  readonly description: string;
  readonly pricePerUnit: number;
  readonly unitsToSell: number;
  readonly dateOfHarvest: string;
}

export interface ProductResponse {
  readonly productId: string;
  readonly description: string;
  readonly pricePerUnit: number;
  readonly unitsToSell: number;
  readonly dateOfHarvest: string;
  /** e.g. /images/<uuid>.jpg - load it with fileUrl() */
  readonly imageUrl: string | null;
}

/** Below this many units a product counts as "almost sold out". */
export const LOW_STOCK_THRESHOLD = 5;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly url = apiUrl('products');

  getAllProducts(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.url);
  }

  /**
   * The backend expects multipart/form-data with a JSON part "product"
   * and an optional file part "image".
   */
  createProduct(request: ProductRequest, image: File | null): Observable<ProductResponse> {
    const form = new FormData();
    form.append('product', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (image) {
      form.append('image', image);
    }
    return this.http.post<ProductResponse>(this.url, form);
  }
}
