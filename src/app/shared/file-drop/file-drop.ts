import { Component, input, output, signal } from '@angular/core';
import { CloudUpload, LucideAngularModule } from 'lucide-angular';

/** Click or drag & drop area that emits the chosen file. */
@Component({
  selector: 'app-file-drop',
  imports: [LucideAngularModule],
  template: `
    <label
      class="dropzone"
      [class.dragover]="dragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver.set(false)"
      (drop)="onDrop($event)"
    >
      <input type="file" class="sr-only" [accept]="accept()" (change)="onChange($event)" />
      <lucide-icon [img]="uploadIcon" [size]="26" />
      <span class="dropzone-title">{{ label() }}</span>
      <span class="dropzone-hint">{{ hint() }}</span>
    </label>
  `
})
export class FileDropComponent {
  readonly accept = input('*/*');
  readonly label = input('Datei hierher ziehen oder klicken');
  readonly hint = input('');
  readonly fileSelected = output<File>();

  protected readonly dragOver = signal(false);
  protected readonly uploadIcon = CloudUpload;

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.fileSelected.emit(file);
  }

  protected onChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.fileSelected.emit(file);
    // Reset so choosing the same file again still fires (change).
    input.value = '';
  }
}
