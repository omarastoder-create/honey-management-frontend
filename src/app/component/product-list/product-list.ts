import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductResponse, ProductService } from '../../services/products';

@Component({
  imports: [CommonModule,ReactiveFormsModule],
  standalone: true,
  selector: 'app-product-list',
  styleUrl: './product-list.scss',
  templateUrl: './product-list.html',
})
export class ProductList {

  private productService = inject(ProductService);

  products = signal<ProductResponse[]>([]); 
  
  productForm = new FormGroup({
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

  onSubmit(): void {
    if (this.productForm.invalid) return;

    const request = {
      description: this.productForm.value.description!,
      pricePerUnit: Number(this.productForm.value.pricePerUnit!),
      unitsToSell: Number(this.productForm.value.unitsToSell!),
      dateOfHarvest: new Date(this.productForm.value.dateOfHarvest!)
    };

    this.productService.createProduct(request).subscribe({
      next: (newProduct) => {
        this.products.update(current => [...current, newProduct]);
        this.productForm.reset();
      },
      error: (err) => console.error('Fehler beim Erstellen:', err)
    });
  }


}
