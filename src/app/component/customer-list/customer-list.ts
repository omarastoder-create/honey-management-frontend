// src/app/component/customer-list/customer-list.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CustomerService, CustomerResponse } from '../../services/customer.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss'
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);

  customers = signal<CustomerResponse[]>([]);

  customerForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    familyName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    description: new FormControl('', [Validators.required, Validators.minLength(5)]),
    phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)])
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (data) => this.customers.set(data),
      error: (err) => console.error('Fehler beim Laden der Kunden:', err)
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) return;

    const request = {
      name: this.customerForm.value.name!,
      familyName: this.customerForm.value.familyName!,
      description: this.customerForm.value.description!,
      phoneNumber: this.customerForm.value.phoneNumber!
    };

    this.customerService.createCustomer(request).subscribe({
      next: (newCustomer) => {
        this.customers.update(current => [...current, newCustomer]);
        this.customerForm.reset();
      },
      error: (err) => console.error('Fehler beim Erstellen:', err)
    });
  }
}