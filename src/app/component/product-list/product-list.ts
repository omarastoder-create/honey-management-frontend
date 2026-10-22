import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Boxes, Calendar, Coins, Droplet, LucideAngularModule, Package, Plus, Search, Trash2 } from 'lucide-angular';
import { fileUrl } from '../../core/api';
import { fileSize, matchesSearch, todayIso } from '../../core/format';
import { applyFieldErrors, errorMessage } from '../../core/http-error';
import { compressImage } from '../../core/image';
import { ToastService } from '../../core/toast.service';
import { FileDropComponent } from '../../shared/file-drop/file-drop';
import { ModalComponent } from '../../shared/modal/modal';
import { LOW_STOCK_THRESHOLD, ProductResponse, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, LucideAngularModule, ModalComponent, FileDropComponent],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  protected readonly products = signal<ProductResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');

  protected readonly modalOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly image = signal<File | null>(null);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly processingImage = signal(false);

  protected readonly icons = { plus: Plus, search: Search, droplet: Droplet, calendar: Calendar, trash: Trash2, package: Package, boxes: Boxes, coins: Coins };
  protected readonly fileUrl = fileUrl;
  protected readonly fileSize = fileSize;
  protected readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  protected readonly form = new FormGroup({
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    pricePerUnit: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    unitsToSell: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    dateOfHarvest: new FormControl(todayIso(), { nonNullable: true, validators: [Validators.required] })
  });

  protected readonly filtered = computed(() =>
    this.products().filter(p => matchesSearch(this.search(), p.description))
  );

  protected readonly totalUnits = computed(() => this.products().reduce((sum, p) => sum + p.unitsToSell, 0));
  protected readonly stockValue = computed(() =>
    this.products().reduce((sum, p) => sum + p.unitsToSell * p.pricePerUnit, 0)
  );
  protected readonly maxStock = computed(() => Math.max(1, ...this.products().map(p => p.unitsToSell)));

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe({
      next: data => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(errorMessage(err, 'Produkte konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  protected openModal(): void {
    this.form.reset({ description: '', pricePerUnit: null, unitsToSell: null, dateOfHarvest: todayIso() });
    this.formError.set(null);
    this.clearImage();
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
    this.clearImage();
  }

  protected async onImageSelected(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.toast.error('Bitte ein Bild auswählen (JPG, PNG oder WebP).');
      return;
    }
    this.processingImage.set(true);
    try {
      const compressed = await compressImage(file, 1200, 0.82);
      this.clearImage();
      this.image.set(compressed);
      this.imagePreview.set(URL.createObjectURL(compressed));
    } catch {
      this.toast.error('Das Bild konnte nicht verarbeitet werden.');
    } finally {
      this.processingImage.set(false);
    }
  }

  protected clearImage(): void {
    const preview = this.imagePreview();
    if (preview) URL.revokeObjectURL(preview);
    this.imagePreview.set(null);
    this.image.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.formError.set(null);

    this.productService
      .createProduct(
        {
          description: value.description.trim(),
          pricePerUnit: Number(value.pricePerUnit),
          unitsToSell: Number(value.unitsToSell),
          dateOfHarvest: value.dateOfHarvest
        },
        this.image()
      )
      .subscribe({
        next: product => {
          this.products.update(list => [...list, product]);
          this.toast.success(`„${product.description}“ wurde angelegt.`);
          this.saving.set(false);
          this.closeModal();
        },
        error: err => {
          if (!applyFieldErrors(this.form, err)) {
            this.formError.set(errorMessage(err, 'Produkt konnte nicht gespeichert werden.'));
          }
          this.saving.set(false);
        }
      });
  }

  protected showError(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }
}
