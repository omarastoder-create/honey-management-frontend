import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LucideAngularModule, Plus, Store } from 'lucide-angular';
import { avatarTone, initials } from '../../core/format';
import { applyFieldErrors, errorMessage } from '../../core/http-error';
import { ToastService } from '../../core/toast.service';
import { SellerResponse, SellerService } from '../../services/seller.service';
import { TransactionService } from '../../services/transaction.service';
import { ModalComponent } from '../../shared/modal/modal';

interface SellerStats {
  readonly sales: number;
  readonly revenue: number;
  readonly lastSale: string | null;
}

@Component({
  selector: 'app-seller-list',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, LucideAngularModule, ModalComponent],
  templateUrl: './seller-list.html',
  styleUrl: './seller-list.scss'
})
export class SellerListComponent implements OnInit {
  private readonly sellerService = inject(SellerService);
  private readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);

  protected readonly sellers = signal<SellerResponse[]>([]);
  protected readonly statsByName = signal<ReadonlyMap<string, SellerStats>>(new Map());
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly modalOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly icons = { plus: Plus, store: Store };
  protected readonly initials = initials;
  protected readonly avatarTone = avatarTone;

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] })
  });

  /** Best seller first. */
  protected readonly ranked = computed(() =>
    [...this.sellers()].sort((a, b) => this.statsFor(b.name).revenue - this.statsFor(a.name).revenue)
  );

  ngOnInit(): void {
    forkJoin({
      sellers: this.sellerService.getAllSellers(),
      transactions: this.transactionService.getAllTransactions()
    }).subscribe({
      next: ({ sellers, transactions }) => {
        // Seller names are unique in the backend, so the name identifies the seller in a sale.
        const stats = new Map<string, SellerStats>();
        for (const tx of transactions) {
          const s = stats.get(tx.sellerName) ?? { sales: 0, revenue: 0, lastSale: null };
          stats.set(tx.sellerName, {
            sales: s.sales + 1,
            revenue: s.revenue + tx.totalPrice,
            lastSale: !s.lastSale || tx.saleDate > s.lastSale ? tx.saleDate : s.lastSale
          });
        }
        this.sellers.set(sellers);
        this.statsByName.set(stats);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(errorMessage(err, 'Verkäufer konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  protected statsFor(name: string): SellerStats {
    return this.statsByName().get(name) ?? { sales: 0, revenue: 0, lastSale: null };
  }

  protected openModal(): void {
    this.form.reset({ name: '' });
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    this.sellerService.createSeller({ name: this.form.getRawValue().name.trim() }).subscribe({
      next: seller => {
        this.sellers.update(list => [...list, seller]);
        this.toast.success(`${seller.name} wurde als Verkäufer angelegt.`);
        this.saving.set(false);
        this.modalOpen.set(false);
      },
      error: err => {
        if (!applyFieldErrors(this.form, err)) {
          this.formError.set(errorMessage(err, 'Verkäufer konnte nicht angelegt werden.'));
        }
        this.saving.set(false);
      }
    });
  }
}
