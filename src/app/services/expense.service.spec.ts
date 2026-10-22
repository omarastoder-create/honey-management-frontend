import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ExpenseService } from './expense.service';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ExpenseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads the receipt as multipart part "file" with PUT', () => {
    const file = new File(['%PDF-1.7'], 'rechnung.pdf', { type: 'application/pdf' });

    service.uploadReceipt('abc', file).subscribe();

    const req = http.expectOne('http://localhost:8080/api/v1/expenses/abc/receipt');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).toBe(file);
    req.flush({});
  });

  it('removes the receipt with DELETE', () => {
    service.deleteReceipt('abc').subscribe();

    const req = http.expectOne('http://localhost:8080/api/v1/expenses/abc/receipt');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
