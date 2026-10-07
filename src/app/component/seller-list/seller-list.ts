// src/app/component/seller-list/seller-list.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { SellerService, SellerResponse } from '../../services/seller.service';

@Component({
  selector: 'app-seller-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-list.html',
  styleUrl: './seller-list.scss'
})
export class SellerListComponent implements OnInit {
  private sellerService = inject(SellerService);
  
  sellers = signal<SellerResponse[]>([]);
  
  sellerForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)])
  });

  ngOnInit(): void {
    this.loadSellers();
  }

  loadSellers(): void {
    this.sellerService.getAllSellers().subscribe({
      next: (data) => this.sellers.set(data),
      error: (err) => console.error('Fehler beim Laden der Seller:', err)
    });
  }

  onSubmit(): void {
    if (this.sellerForm.invalid) return;

    const request = { name: this.sellerForm.value.name! };
    this.sellerService.createSeller(request).subscribe({
      next: (newSeller) => {
        this.sellers.update(current => [...current, newSeller]);
        this.sellerForm.reset();
      },
      error: (err) => console.error('Fehler beim Erstellen:', err)
    });
  }
}