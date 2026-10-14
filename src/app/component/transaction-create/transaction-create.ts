// src/app/component/transaction-create/transaction-create.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SellerResponse, SellerService } from '../../services/seller.service';
import { CustomerResponse, CustomerService } from '../../services/customer.service';
import { ProductResponse, ProductService } from '../../services/products';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-create.html',
  styleUrl: './transaction-create.scss'
})
export class TransactionCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  
  private readonly sellerService = inject(SellerService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly transactionService = inject(TransactionService);

  readonly sellers = signal<SellerResponse[]>([]);
  readonly customers = signal<CustomerResponse[]>([]);
  readonly products = signal<ProductResponse[]>([]);
  readonly errorMessage = signal<string | null>(null);

  readonly transactionForm: FormGroup = this.fb.group({
    sellerId: ['', Validators.required],
    customerId: ['', Validators.required],
    items: this.fb.array([], Validators.required)
  });

  ngOnInit(): void {
    this.sellerService.getAllSellers().subscribe(data => this.sellers.set(data));
    this.customerService.getAllCustomers().subscribe(data => this.customers.set(data));
    this.productService.getAllProducts().subscribe(data => this.products.set(data));
    this.addItem();
  }

  get items(): FormArray {
    return this.transactionForm.get('items') as FormArray;
  }

  addItem(): void {
    const itemForm = this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
    this.items.push(itemForm);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    const payload = this.transactionForm.value;
    
    // Angepasst an die Backend-Methodenbezeichnung (createSaleTransaction)
    this.transactionService.createSaleTransaction(payload).subscribe({
      next: () => {
        this.router.navigate(['/transactions']);
      },
      error: (err) => {
        if (err.status === 400 && err.error?.message) {
          this.errorMessage.set(err.error.message);
        } else {
          this.errorMessage.set('Ein unerwarteter Serverfehler ist aufgetreten.');
        }
        console.error('Fehler beim Erstellen der Transaktion:', err);
      }
    });
  }
}