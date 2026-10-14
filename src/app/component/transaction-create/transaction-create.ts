// src/app/component/transaction-create/transaction-create.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SellerResponse, SellerService } from '../../services/seller.service';
import { CustomerResponse, CustomerService } from '../../services/customer.service';
import { ProductResponse, ProductService } from '../../services/products';
import { SaleTransactionRequest, TransactionService } from '../../services/transaction.service';

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
      quantity: [1, [Validators.required, Validators.min(1)]],
      customPricePerUnit: [null as number | null, [Validators.min(0)]],
      isGift: [false]
    });

    // Wenn "Geschenk" aktiviert wird, Sonderpreis-Feld leeren und deaktivieren
    itemForm.get('isGift')?.valueChanges.subscribe((isGift: boolean | null) => {
      const priceControl = itemForm.get('customPricePerUnit');
      if (isGift) {
        priceControl?.setValue(null, { emitEvent: false });
        priceControl?.disable({ emitEvent: false });
      } else {
        priceControl?.enable({ emitEvent: false });
      }
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

    // getRawValue() inkludiert auch deaktivierte Felder (wie customPricePerUnit bei isGift = true)
    const rawValue = this.transactionForm.getRawValue();

    // Sauberes DTO-Mapping verhindert 400 Bad Request durch leere Strings ("")
    const payload: SaleTransactionRequest = {
      sellerId: rawValue.sellerId,
      customerId: rawValue.customerId,
      items: rawValue.items.map((item: any) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        customPricePerUnit:
          item.isGift || item.customPricePerUnit === '' || item.customPricePerUnit === null
            ? null
            : Number(item.customPricePerUnit),
        isGift: Boolean(item.isGift)
      }))
    };

    this.transactionService.createSaleTransaction(payload).subscribe({
      next: () => {
        this.router.navigate(['/transactions']);
      },
      error: (err) => {
        const backendMsg =
          err.error?.message ||
          (typeof err.error === 'string' ? err.error : null) ||
          'Ungültige Eingabe oder nicht genügend Bestand (400 Bad Request).';
        this.errorMessage.set(backendMsg);
        console.error('Fehler beim Erstellen der Transaktion:', err);
      }
    });
  }
}