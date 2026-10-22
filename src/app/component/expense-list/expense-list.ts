import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, catchError, of, switchMap } from 'rxjs';
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Image,
  LucideAngularModule,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  Wallet
} from 'lucide-angular';
import { fileUrl } from '../../core/api';
import { fileSize, matchesSearch, todayIso } from '../../core/format';
import { applyFieldErrors, errorMessage } from '../../core/http-error';
import { compressImage } from '../../core/image';
import { ToastService } from '../../core/toast.service';
import { ExpenseResponse, ExpenseService } from '../../services/expense.service';
import { FileDropComponent } from '../../shared/file-drop/file-drop';
import { ModalComponent } from '../../shared/modal/modal';

type ReceiptFilter = 'all' | 'with' | 'without';

const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

@Component({
  selector: 'app-expense-list',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, LucideAngularModule, ModalComponent, FileDropComponent],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss'
})
export class ExpenseListComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  /** ?neu=1 (e.g. from the dashboard) opens the "new expense" dialog directly. */
  readonly neu = input<string>();

  protected readonly expenses = signal<ExpenseResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly receiptFilter = signal<ReceiptFilter>('all');

  // "New expense" dialog
  protected readonly modalOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly receiptFile = signal<File | null>(null);
  protected readonly receiptPreview = signal<string | null>(null);
  protected readonly preparingFile = signal(false);

  // Receipt viewer and row actions
  protected readonly viewing = signal<ExpenseResponse | null>(null);
  protected readonly uploadingId = signal<string | null>(null);
  protected readonly confirmDeleteId = signal<string | null>(null);
  private pendingUploadId: string | null = null;
  private readonly rowFileInput = viewChild.required<ElementRef<HTMLInputElement>>('rowFileInput');

  protected readonly icons = {
    plus: Plus, search: Search, paperclip: Paperclip, file: FileText, image: Image, trash: Trash2,
    external: ExternalLink, replace: RefreshCw, wallet: Wallet, calendar: CalendarDays, warning: TriangleAlert
  };
  protected readonly fileUrl = fileUrl;
  protected readonly fileSize = fileSize;

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    supplierName: new FormControl('', { nonNullable: true }),
    expenseDate: new FormControl(todayIso(), { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)])
  });

  protected readonly filtered = computed(() =>
    this.expenses().filter(e => {
      const receiptOk =
        this.receiptFilter() === 'all' || (this.receiptFilter() === 'with') === !!e.receiptUrl;
      return receiptOk && matchesSearch(this.search(), e.title, e.supplierName);
    })
  );

  protected readonly total = computed(() => this.expenses().reduce((sum, e) => sum + e.amount, 0));

  protected readonly thisMonth = computed(() => {
    const now = new Date();
    return this.expenses()
      .filter(e => {
        const d = new Date(e.expenseDate);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  });

  protected readonly withoutReceipt = computed(() => this.expenses().filter(e => !e.receiptUrl).length);

  protected readonly viewerUrl = computed<SafeResourceUrl | null>(() => {
    const url = fileUrl(this.viewing()?.receiptUrl);
    // Our own backend URL - needed so the PDF can be shown in an <iframe>.
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  ngOnInit(): void {
    this.expenseService.getAllExpenses().subscribe({
      next: data => {
        this.expenses.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(errorMessage(err, 'Ausgaben konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
    if (this.neu()) {
      this.openModal();
    }
  }

  protected isPdf(url: string | null | undefined): boolean {
    return !!url && url.toLowerCase().endsWith('.pdf');
  }

  // ---------- New expense ----------

  protected openModal(): void {
    this.form.reset({ title: '', supplierName: '', expenseDate: todayIso(), amount: null });
    this.formError.set(null);
    this.clearReceipt();
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
    this.clearReceipt();
  }

  protected async onReceiptSelected(file: File): Promise<void> {
    const prepared = await this.prepareReceipt(file);
    if (!prepared) return;
    this.clearReceipt();
    this.receiptFile.set(prepared);
    if (prepared.type.startsWith('image/')) {
      this.receiptPreview.set(URL.createObjectURL(prepared));
    }
  }

  protected clearReceipt(): void {
    const preview = this.receiptPreview();
    if (preview) URL.revokeObjectURL(preview);
    this.receiptPreview.set(null);
    this.receiptFile.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const receipt = this.receiptFile();
    this.saving.set(true);
    this.formError.set(null);

    this.expenseService
      .createExpense({
        title: value.title.trim(),
        supplierName: value.supplierName.trim() || null,
        expenseDate: value.expenseDate,
        amount: Number(value.amount)
      })
      .pipe(
        // Step 2: upload the receipt for the new expense. If only the upload fails,
        // the expense is still saved and the receipt can be added later from the list.
        switchMap((created): Observable<ExpenseResponse> =>
          receipt
            ? this.expenseService.uploadReceipt(created.expenseId, receipt).pipe(
                catchError(err => {
                  this.toast.error(`Ausgabe gespeichert, Beleg-Upload fehlgeschlagen: ${errorMessage(err)}`);
                  return of(created);
                })
              )
            : of(created)
        )
      )
      .subscribe({
        next: expense => {
          this.upsert(expense);
          this.toast.success(expense.receiptUrl ? 'Ausgabe mit Beleg gespeichert.' : 'Ausgabe gespeichert.');
          this.saving.set(false);
          this.closeModal();
        },
        error: err => {
          if (!applyFieldErrors(this.form, err)) {
            this.formError.set(errorMessage(err, 'Ausgabe konnte nicht gespeichert werden.'));
          }
          this.saving.set(false);
        }
      });
  }

  // ---------- Receipts on existing expenses ----------

  protected chooseReceiptFor(expense: ExpenseResponse, picker?: HTMLInputElement): void {
    this.pendingUploadId = expense.expenseId;
    (picker ?? this.rowFileInput().nativeElement).click();
  }

  protected async onRowFileChosen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const id = this.pendingUploadId;
    this.pendingUploadId = null;
    if (!file || !id) return;

    const prepared = await this.prepareReceipt(file);
    if (!prepared) return;

    this.uploadingId.set(id);
    this.expenseService.uploadReceipt(id, prepared).subscribe({
      next: updated => {
        this.upsert(updated);
        this.toast.success('Beleg gespeichert.');
        this.uploadingId.set(null);
      },
      error: err => {
        this.toast.error(errorMessage(err, 'Beleg konnte nicht hochgeladen werden.'));
        this.uploadingId.set(null);
      }
    });
  }

  protected removeReceipt(expense: ExpenseResponse): void {
    this.expenseService.deleteReceipt(expense.expenseId).subscribe({
      next: updated => {
        this.upsert(updated);
        this.viewing.set(null);
        this.toast.success('Beleg entfernt.');
      },
      error: err => this.toast.error(errorMessage(err, 'Beleg konnte nicht entfernt werden.'))
    });
  }

  // ---------- Delete expense (click twice to confirm) ----------

  protected deleteExpense(expense: ExpenseResponse): void {
    if (this.confirmDeleteId() !== expense.expenseId) {
      this.confirmDeleteId.set(expense.expenseId);
      setTimeout(() => {
        if (this.confirmDeleteId() === expense.expenseId) this.confirmDeleteId.set(null);
      }, 3000);
      return;
    }
    this.confirmDeleteId.set(null);
    this.expenseService.deleteExpense(expense.expenseId).subscribe({
      next: () => {
        this.expenses.update(list => list.filter(e => e.expenseId !== expense.expenseId));
        this.toast.success(`„${expense.title}“ gelöscht.`);
      },
      error: err => this.toast.error(errorMessage(err, 'Ausgabe konnte nicht gelöscht werden.'))
    });
  }

  protected showError(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  /**
   * Accepts PDFs and photos. Photos are shrunk (receipts stay readable at 1600 px),
   * which also keeps them well below the backend's 8 MB limit.
   */
  private async prepareReceipt(file: File): Promise<File | null> {
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      this.toast.error('Bitte ein PDF oder ein Foto des Belegs auswählen.');
      return null;
    }
    let prepared = file;
    if (isImage) {
      this.preparingFile.set(true);
      try {
        prepared = await compressImage(file, 1600, 0.85);
      } catch {
        this.toast.error('Das Foto konnte nicht verarbeitet werden.');
        return null;
      } finally {
        this.preparingFile.set(false);
      }
    }
    if (prepared.size > MAX_RECEIPT_BYTES) {
      this.toast.error(`Die Datei ist zu groß (${fileSize(prepared.size)}). Maximal 8 MB.`);
      return null;
    }
    return prepared;
  }

  /** Replaces an expense in the list (or adds it) and keeps the list sorted by date. */
  private upsert(expense: ExpenseResponse): void {
    this.expenses.update(list =>
      [...list.filter(e => e.expenseId !== expense.expenseId), expense].sort((a, b) =>
        b.expenseDate.localeCompare(a.expenseDate)
      )
    );
    if (this.viewing()?.expenseId === expense.expenseId) {
      this.viewing.set(expense.receiptUrl ? expense : null);
    }
  }
}
