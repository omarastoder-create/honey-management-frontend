// src/app/component/expense-list/expense-list.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpenseService, ExpenseResponse } from '../../services/expense';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss'
})
export class ExpenseListComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly fb = inject(FormBuilder);

  readonly expenses = signal<ExpenseResponse[]>([]);
  readonly errorMessage = signal<string | null>(null);

  readonly totalExpenses = computed(() =>
    this.expenses().reduce((sum, exp) => sum + (exp.amount ?? 0), 0)
  );

  readonly expenseForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    supplierName: [''],
    expenseDate: [new Date().toISOString().split('T')[0], Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    receiptImagePath: ['']
  });

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.expenseService.getAllExpenses().subscribe({
      next: (data) => this.expenses.set(data),
      error: (err) => {
        console.error('Fehler beim Laden der Ausgaben:', err);
        this.errorMessage.set('Ausgaben konnten nicht geladen werden.');
      }
    });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) return;

    const formValue = this.expenseForm.getRawValue();
    this.expenseService.createExpense(formValue).subscribe({
      next: () => {
        this.loadExpenses();
        this.expenseForm.reset({
          expenseDate: new Date().toISOString().split('T')[0],
          amount: 0
        });
        this.errorMessage.set(null);
      },
      error: (err) => {
        console.error('Fehler beim Speichern der Ausgabe:', err);
        this.errorMessage.set('Fehler beim Speichern der Ausgabe.');
      }
    });
  }

  deleteExpense(id: string): void {
    this.expenseService.deleteExpense(id).subscribe({
      next: () => this.loadExpenses(),
      error: (err) => console.error('Fehler beim Löschen:', err)
    });
  }
}