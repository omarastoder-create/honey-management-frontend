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
  selectedCustomer = signal<CustomerResponse | null>(null);
  isEditing = signal<boolean>(false);

  countryCodes = [
    { code: '+352', label: 'LU (+352)' },
    { code: '+49', label: 'DE (+49)' },
    { code: '+33', label: 'FR (+33)' },
    { code: '+32', label: 'BE (+32)' },
    { code: '+41', label: 'CH (+41)' }
  ];

  customerForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    familyName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    description: new FormControl('', [Validators.required, Validators.minLength(3)]),
    prefix: new FormControl('+352', [Validators.required]),
    phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{6,15}$/)]),
    email: new FormControl('', [Validators.email])
  });

  editForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    familyName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    description: new FormControl('', [Validators.required, Validators.minLength(3)]),
    prefix: new FormControl('+352', [Validators.required]),
    phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{6,15}$/)]),
    email: new FormControl('', [Validators.email])
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

    const formVal = this.customerForm.value;
    const fullPhoneNumber = `${formVal.prefix}${formVal.phoneNumber}`;

    const request = {
      name: formVal.name!,
      familyName: formVal.familyName!,
      description: formVal.description!,
      phoneNumber: fullPhoneNumber,
      email: formVal.email || undefined
    };

    this.customerService.createCustomer(request).subscribe({
      next: (newCustomer) => {
        this.customers.update(current => [...current, newCustomer]);
        this.customerForm.reset({ prefix: '+352' });
      },
      error: (err) => console.error('Fehler beim Erstellen:', err)
    });
  }

  showDetails(customer: CustomerResponse): void {
    this.selectedCustomer.set(customer);
    this.isEditing.set(false);
  }

  closeDetails(): void {
    this.selectedCustomer.set(null);
    this.isEditing.set(false);
  }

  startUpdate(): void {
    const cust = this.selectedCustomer();
    if (!cust) return;

    // Vorwahl und Nummer trennen (vereinfacht für gängige Prefixes)
    let prefix = '+352';
    let rawNumber = cust.phoneNumber;
    for (const c of this.countryCodes) {
      if (cust.phoneNumber.startsWith(c.code)) {
        prefix = c.code;
        rawNumber = cust.phoneNumber.replace(c.code, '');
        break;
      }
    }

    this.editForm.setValue({
      name: cust.name,
      familyName: cust.familyName,
      description: cust.description ?? '',
      prefix: prefix,
      phoneNumber: rawNumber,
      email: cust.email ?? ''
    });

    this.isEditing.set(true);
  }

  cancelUpdate(): void {
    this.isEditing.set(false);
  }

  saveUpdate(): void {
    const cust = this.selectedCustomer();
    if (!cust || this.editForm.invalid) return;

    const formVal = this.editForm.value;
    const fullPhoneNumber = `${formVal.prefix}${formVal.phoneNumber}`;

    const request = {
      name: formVal.name!,
      familyName: formVal.familyName!,
      description: formVal.description!,
      phoneNumber: fullPhoneNumber,
      email: formVal.email || undefined
    };

    this.customerService.updateCustomer(cust.customerId, request).subscribe({
      next: (updatedCustomer) => {
        this.customers.update(list => 
          list.map(c => c.customerId === updatedCustomer.customerId ? updatedCustomer : c)
        );
        this.selectedCustomer.set(updatedCustomer);
        this.isEditing.set(false);
      },
      error: (err) => console.error('Fehler beim Aktualisieren:', err)
    });
  }
}