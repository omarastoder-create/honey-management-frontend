// src/app/component/product-list/product-list.ts
import { CommonModule } from '@angular/common';
// WICHTIG: ChangeDetectorRef hinzugefügt
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core'; 
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductRequest, ProductResponse, ProductService } from '../../services/products';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  selector: 'app-product-list',
  styleUrl: './product-list.scss',
  templateUrl: './product-list.html',
})
export class ProductList implements OnInit {

  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef); // WICHTIG: Injektion des ChangeDetectors

  readonly products = signal<ProductResponse[]>([]); 
  
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  
  readonly productForm = new FormGroup({
    description: new FormControl('', [Validators.required, Validators.minLength(5)]),
    pricePerUnit: new FormControl('', [Validators.required, Validators.min(0)]),
    unitsToSell: new FormControl('', [Validators.required, Validators.min(1)]),
    dateOfHarvest: new FormControl('', [Validators.required])
  });
  
  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => this.products.set(data),
      error: (err) => console.error('Fehler beim Laden der Produkte:', err)
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const originalFile = input.files[0];

      try {
        this.selectedFile = await this.compressImage(originalFile, 800, 800, 0.8);
        
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result;
          
          // WICHTIG: Zwingt Angular dazu, das UI sofort zu aktualisieren!
          this.cdr.detectChanges(); 
        };
        reader.readAsDataURL(this.selectedFile);
      } catch (error) {
        console.error('Fehler bei der Bildkomprimierung:', error);
      } finally {
        // Optionaler Bugfix: Setzt das Input-Feld zurück. 
        // Ohne dies feuert das (change)-Event nicht, wenn du 2x exakt dasselbe Bild auswählst.
        input.value = ''; 
      }
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const request: ProductRequest = {
      description: this.productForm.value.description!,
      pricePerUnit: Number(this.productForm.value.pricePerUnit!),
      unitsToSell: Number(this.productForm.value.unitsToSell!),
      dateOfHarvest: this.productForm.value.dateOfHarvest!
    };

    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('product', jsonBlob);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.productService.createProduct(formData).subscribe({
      next: (newProduct) => {
        this.products.update(current => [...current, newProduct]);
        this.productForm.reset();
        this.selectedFile = null;
        this.imagePreview = null;
      },
      error: (err) => console.error('Fehler beim Erstellen:', err)
    });
  }

  private compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > height && width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else if (height > width && height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas API nicht unterstützt.'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
                resolve(new File([blob], newFileName, { type: 'image/jpeg' }));
              } else {
                reject(new Error('Blob Generierung fehlgeschlagen.'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      };
      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    });
  }
}