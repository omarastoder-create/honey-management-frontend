import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Mail, Pencil, Phone, Search, UserPlus, Users } from 'lucide-angular';
import { avatarTone, initials, matchesSearch } from '../../core/format';
import { applyFieldErrors, errorMessage } from '../../core/http-error';
import { ToastService } from '../../core/toast.service';
import { CustomerRequest, CustomerResponse, CustomerService } from '../../services/customer.service';
import { ModalComponent } from '../../shared/modal/modal';

type Mode = 'create' | 'view' | 'edit';

const COUNTRY_CODES = [
  { code: '+352', label: 'LU +352' },
  { code: '+49', label: 'DE +49' },
  { code: '+33', label: 'FR +33' },
  { code: '+32', label: 'BE +32' },
  { code: '+41', label: 'CH +41' }
];

@Component({
  selector: 'app-customer-list',
  imports: [ReactiveFormsModule, LucideAngularModule, ModalComponent],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss'
})
export class CustomerListComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);

  protected readonly customers = signal<CustomerResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');

  protected readonly mode = signal<Mode | null>(null);
  protected readonly selected = signal<CustomerResponse | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly icons = { search: Search, add: UserPlus, phone: Phone, mail: Mail, edit: Pencil, users: Users };
  protected readonly countryCodes = COUNTRY_CODES;
  protected readonly initials = initials;
  protected readonly avatarTone = avatarTone;

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    familyName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    prefix: new FormControl('+352', { nonNullable: true }),
    // Digits, spaces allowed while typing ("621 123 456")
    phoneNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d[\d ]{4,16}$/)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] })
  });

  protected readonly filtered = computed(() =>
    this.customers()
      .filter(c => matchesSearch(this.search(), c.name, c.familyName, c.phoneNumber, c.email, c.description))
      .sort((a, b) => `${a.name} ${a.familyName}`.localeCompare(`${b.name} ${b.familyName}`))
  );

  protected readonly modalTitle = computed(() => {
    switch (this.mode()) {
      case 'create': return 'Neuer Kunde';
      case 'edit': return 'Kunde bearbeiten';
      default: return 'Kundenprofil';
    }
  });

  ngOnInit(): void {
    this.customerService.getAllCustomers().subscribe({
      next: data => {
        this.customers.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(errorMessage(err, 'Kunden konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  protected openCreate(): void {
    this.selected.set(null);
    this.form.reset({ name: '', familyName: '', description: '', prefix: '+352', phoneNumber: '', email: '' });
    this.formError.set(null);
    this.mode.set('create');
  }

  protected openDetails(customer: CustomerResponse): void {
    this.selected.set(customer);
    this.mode.set('view');
  }

  protected startEdit(): void {
    const c = this.selected();
    if (!c) return;
    const { prefix, number } = this.splitPhone(c.phoneNumber);
    this.form.reset({
      name: c.name,
      familyName: c.familyName,
      description: c.description ?? '',
      prefix,
      phoneNumber: number,
      email: c.email ?? ''
    });
    this.formError.set(null);
    this.mode.set('edit');
  }

  protected closeModal(): void {
    this.mode.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: CustomerRequest = {
      name: v.name.trim(),
      familyName: v.familyName.trim(),
      description: v.description.trim() || null,
      phoneNumber: v.prefix + v.phoneNumber.replace(/\s/g, ''),
      email: v.email.trim() || null
    };
    const editing = this.mode() === 'edit' ? this.selected() : null;
    const save$ = editing
      ? this.customerService.updateCustomer(editing.customerId, request)
      : this.customerService.createCustomer(request);

    this.saving.set(true);
    this.formError.set(null);
    save$.subscribe({
      next: saved => {
        this.customers.update(list => [...list.filter(c => c.customerId !== saved.customerId), saved]);
        this.toast.success(editing ? 'Änderungen gespeichert.' : `${saved.name} ${saved.familyName} wurde angelegt.`);
        this.saving.set(false);
        if (editing) {
          this.selected.set(saved);
          this.mode.set('view');
        } else {
          this.closeModal();
        }
      },
      error: err => {
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.formError.set('Diese Telefonnummer oder E-Mail gehört bereits zu einem anderen Kunden.');
        } else if (!applyFieldErrors(this.form, err)) {
          this.formError.set(errorMessage(err, 'Kunde konnte nicht gespeichert werden.'));
        }
        this.saving.set(false);
      }
    });
  }

  protected showError(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  private splitPhone(phone: string): { prefix: string; number: string } {
    const match = COUNTRY_CODES.find(c => phone.startsWith(c.code));
    return match ? { prefix: match.code, number: phone.slice(match.code.length) } : { prefix: '+352', number: phone.replace(/^\+/, '') };
  }
}
