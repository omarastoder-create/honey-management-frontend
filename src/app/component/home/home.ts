// src/app/component/home/home.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="dashboard-card">
      <h2>Willkommen im Dashboard</h2>
      <p>Wähle einen Bereich aus der oberen Navigation, um die Daten zu verwalten.</p>
    </div>
  `,
  styles: [`
    .dashboard-card {
      background: #fff;
      padding: 40px;
      border-radius: 8px;
      border: 1px solid #e8e0c5;
      text-align: center;
      color: #5c4e26;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    }
  `]
})
export class HomeComponent {}