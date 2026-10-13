// src/app/component/product-list/product-list.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductRequest, ProductResponse, ProductService } from '../../services/products';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  selector: 'app-product-list',
  styleUrl: './product-list.scss',
  templateUrl: './product-list.html',
})
export class ProductList implements OnInit {

  private readonly productService = inject(ProductService);

  readonly products = signal<ProductResponse[]>([]); 
  
  // State für die hochzuladende Datei
  selectedFile: File | null = null;
  
  readonly productForm = new FormGroup({
    description: new FormControl('', [Validators.required, Validators.minLength(5)]),
    pricePerUnit: new FormControl('', [Validators.required, Validators.min(0)]),
    unitsToSell: new FormControl('', [Validators.required, Validators.min(1)]),
    dateOfHarvest: new FormControl('', [Validators.required])
  });
  
  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => this.products.set(data),
      error: (err) => console.error('Fehler beim Laden der Produkte:', err)
    });
  }

  // Event-Handler für die Dateiauswahl im HTML
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const request: ProductRequest = {
      description: this.productForm.value.description!,
      pricePerUnit: Number(this.productForm.value.pricePerUnit!),
      unitsToSell: Number(this.productForm.value.unitsToSell!),
      dateOfHarvest: this.productForm.value.dateOfHarvest!
    };

    const formData = new FormData();
    
    // JSON Payload als Blob anhängen (Wichtig für @RequestPart im Backend)
    const jsonBlob = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('product', jsonBlob);

    // Bild anhängen, falls vorhanden
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.productService.createProduct(formData).subscribe({
      next: (newProduct) => {
        this.products.update(current => [...current, newProduct]);
        this.productForm.reset();
        this.selectedFile = null; // Reset nach Erfolg
      },
      error: (err) => console.error('Fehler beim Erstellen:', err)
    });
  }
}