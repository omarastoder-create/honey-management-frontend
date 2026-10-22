import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductResponse } from '../../services/product.service';
import { TransactionCreateComponent } from './transaction-create';

const waldhonig: ProductResponse = {
  productId: 'p1',
  description: 'Waldhonig',
  pricePerUnit: 10,
  unitsToSell: 3,
  dateOfHarvest: '2026-07-01',
  imageUrl: null
};

// Exposes the protected members the template uses, for testing only.
type Testable = {
  addProduct(p: ProductResponse): void;
  setCustomPrice(id: string, value: string): void;
  setGift(id: string, isGift: boolean): void;
  quantityInCart(id: string): number;
  total(): number;
  savings(): number;
  missing(): string | null;
};

describe('TransactionCreateComponent', () => {
  let component: Testable;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionCreateComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    const fixture = TestBed.createComponent(TransactionCreateComponent);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne(r => r.url.endsWith('/sellers')).flush([{ sellerId: 's1', name: 'Omar' }]);
    http.expectOne(r => r.url.endsWith('/customers')).flush([]);
    http.expectOne(r => r.url.endsWith('/products')).flush([waldhonig]);

    component = fixture.componentInstance as unknown as Testable;
  });

  it('adds products to the cart and computes the total', () => {
    component.addProduct(waldhonig);
    component.addProduct(waldhonig);

    expect(component.quantityInCart('p1')).toBe(2);
    expect(component.total()).toBe(20);
  });

  it('never puts more into the cart than is in stock', () => {
    for (let i = 0; i < 5; i++) component.addProduct(waldhonig);

    expect(component.quantityInCart('p1')).toBe(3);
  });

  it('uses the special price and shows the discount', () => {
    component.addProduct(waldhonig);
    component.addProduct(waldhonig);
    component.setCustomPrice('p1', '8');

    expect(component.total()).toBe(16);
    expect(component.savings()).toBe(4);
  });

  it('charges nothing for gifts', () => {
    component.addProduct(waldhonig);
    component.setGift('p1', true);

    expect(component.total()).toBe(0);
  });

  it('asks for a customer before the sale can be completed', () => {
    component.addProduct(waldhonig);

    expect(component.missing()).toBe('Bitte einen Kunden wählen.');
  });
});
