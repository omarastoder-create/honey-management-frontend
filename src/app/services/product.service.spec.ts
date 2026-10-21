import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const request = { description: 'Waldhonig', pricePerUnit: 9.5, unitsToSell: 10, dateOfHarvest: '2026-07-01' };

  it('sends the product as a JSON part and the image as a file part', async () => {
    const image = new File(['x'], 'honig.jpg', { type: 'image/jpeg' });

    service.createProduct(request, image).subscribe();

    const req = http.expectOne('http://localhost:8080/api/v1/products');
    const body = req.request.body as FormData;
    const productPart = body.get('product') as Blob;
    expect(productPart.type).toBe('application/json');
    expect(JSON.parse(await productPart.text())).toEqual(request);
    expect(body.get('image')).toBe(image);
    req.flush({});
  });

  it('omits the image part when no image was chosen', () => {
    service.createProduct(request, null).subscribe();

    const req = http.expectOne('http://localhost:8080/api/v1/products');
    expect((req.request.body as FormData).has('image')).toBe(false);
    req.flush({});
  });
});
