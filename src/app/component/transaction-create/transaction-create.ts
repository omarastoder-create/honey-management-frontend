import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  Droplet,
  Gift,
  LucideAngularModule,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2
} from 'lucide-angular';
import { fileUrl } from '../../core/api';
import { euro, matchesSearch } from '../../core/format';
import { errorMessage } from '../../core/http-error';
import { ToastService } from '../../core/toast.service';
import { CustomerResponse, CustomerService } from '../../services/customer.service';
import { LOW_STOCK_THRESHOLD, ProductResponse, ProductService } from '../../services/product.service';
import { SellerResponse, SellerService } from '../../services/seller.service';
import { SaleTransactionRequest, TransactionService } from '../../services/transaction.service';

interface CartLine {
  readonly productId: string;
  readonly quantity: number;
  /** null = normal product price */
  readonly customPrice: number | null;
  readonly isGift: boolean;
}

const LAST_SELLER_KEY = 'honey-last-seller';

@Component({
  selector: 'app-transaction-create',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, LucideAngularModule],
  templateUrl: './transaction-create.html',
  styleUrl: './transaction-create.scss'
})
export class TransactionCreateComponent implements OnInit {
  private readonly sellerService = inject(SellerService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly transactionService = inject(TransactionService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly sellers = signal<SellerResponse[]>([]);
  protected readonly customers = signal<CustomerResponse[]>([]);
  protected readonly products = signal<ProductResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly sellerId = signal(this.readLastSeller());
  protected readonly customerId = signal('');
  protected readonly cart = signal<readonly CartLine[]>([]);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly icons = { search: Search, plus: Plus, minus: Minus, trash: Trash2, gift: Gift, cart: ShoppingCart, droplet: Droplet };
  protected readonly fileUrl = fileUrl;
  protected readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  private readonly productsById = computed(() => new Map(this.products().map(p => [p.productId, p])));

  protected readonly filteredProducts = computed(() =>
    this.products().filter(p => matchesSearch(this.search(), p.description))
  );

  /** Cart lines enriched with product data and the price that will actually be charged. */
  protected readonly lines = computed(() =>
    this.cart().flatMap(line => {
      const product = this.productsById().get(line.productId);
      if (!product) return [];
      const unitPrice = line.isGift ? 0 : (line.customPrice ?? product.pricePerUnit);
      return [{
        ...line,
        product,
        unitPrice,
        subtotal: unitPrice * line.quantity,
        overStock: line.quantity > product.unitsToSell
      }];
    })
  );

  protected readonly total = computed(() => this.lines().reduce((sum, l) => sum + l.subtotal, 0));
  protected readonly itemCount = computed(() => this.lines().reduce((sum, l) => sum + l.quantity, 0));
  protected readonly savings = computed(() =>
    this.lines().reduce((sum, l) => sum + (l.product.pricePerUnit - l.unitPrice) * l.quantity, 0)
  );

  protected readonly missing = computed(() => {
    if (!this.sellerId()) return 'Bitte einen Verkäufer wählen.';
    if (!this.customerId()) return 'Bitte einen Kunden wählen.';
    if (this.cart().length === 0) return 'Bitte mindestens ein Produkt hinzufügen.';
    if (this.lines().some(l => l.overStock)) return 'Bei mindestens einer Position reicht der Bestand nicht.';
    return null;
  });

  constructor() {
    // Remember the seller - usually the same person enters several sales in a row.
    effect(() => {
      try {
        localStorage.setItem(LAST_SELLER_KEY, this.sellerId());
      } catch {
        // ignore
      }
    });
  }

  ngOnInit(): void {
    forkJoin({
      sellers: this.sellerService.getAllSellers(),
      customers: this.customerService.getAllCustomers(),
      products: this.productService.getAllProducts()
    }).subscribe({
      next: ({ sellers, customers, products }) => {
        this.sellers.set(sellers);
        this.customers.set([...customers].sort((a, b) => a.name.localeCompare(b.name)));
        this.products.set(products);
        // Drop a remembered seller that no longer exists.
        if (!sellers.some(s => s.sellerId === this.sellerId())) {
          this.sellerId.set(sellers.length === 1 ? sellers[0].sellerId : '');
        }
        this.loading.set(false);
      },
      error: err => {
        this.loadError.set(errorMessage(err, 'Daten konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  protected quantityInCart(productId: string): number {
    return this.cart().find(l => l.productId === productId)?.quantity ?? 0;
  }

  protected addProduct(product: ProductResponse): void {
    const inCart = this.quantityInCart(product.productId);
    if (inCart >= product.unitsToSell) {
      this.toast.info(`Nur ${product.unitsToSell} × ${product.description} auf Lager.`);
      return;
    }
    if (inCart > 0) {
      this.changeQuantity(product.productId, 1);
    } else {
      this.cart.update(c => [...c, { productId: product.productId, quantity: 1, customPrice: null, isGift: false }]);
    }
  }

  protected changeQuantity(productId: string, delta: number): void {
    this.updateLine(productId, l => ({ ...l, quantity: Math.max(1, l.quantity + delta) }));
  }

  protected setQuantity(productId: string, value: string): void {
    const quantity = Number.parseInt(value, 10);
    if (Number.isInteger(quantity) && quantity >= 1) {
      this.updateLine(productId, l => ({ ...l, quantity }));
    }
  }

  protected setCustomPrice(productId: string, value: string): void {
    const price = value.trim() === '' ? null : Number(value);
    if (price === null || (Number.isFinite(price) && price >= 0)) {
      this.updateLine(productId, l => ({ ...l, customPrice: price }));
    }
  }

  protected setGift(productId: string, isGift: boolean): void {
    this.updateLine(productId, l => ({ ...l, isGift, customPrice: null }));
  }

  protected remove(productId: string): void {
    this.cart.update(c => c.filter(l => l.productId !== productId));
  }

  protected submit(): void {
    if (this.missing() || this.submitting()) return;

    const request: SaleTransactionRequest = {
      sellerId: this.sellerId(),
      customerId: this.customerId(),
      items: this.cart().map(l => ({
        productId: l.productId,
        quantity: l.quantity,
        customPricePerUnit: l.isGift ? null : l.customPrice,
        isGift: l.isGift
      }))
    };

    this.submitting.set(true);
    this.submitError.set(null);
    this.transactionService.createSaleTransaction(request).subscribe({
      next: tx => {
        this.toast.success(`Verkauf über ${euro(tx.totalPrice)} an ${tx.customerName} gespeichert.`);
        this.router.navigate(['/transactions']);
      },
      error: err => {
        this.submitError.set(errorMessage(err, 'Verkauf konnte nicht gespeichert werden.'));
        this.submitting.set(false);
      }
    });
  }

  private updateLine(productId: string, change: (line: CartLine) => CartLine): void {
    this.cart.update(c => c.map(l => (l.productId === productId ? change(l) : l)));
  }

  private readLastSeller(): string {
    try {
      return localStorage.getItem(LAST_SELLER_KEY) ?? '';
    } catch {
      return '';
    }
  }
}
