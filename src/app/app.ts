import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import {
  Hexagon,
  LayoutDashboard,
  LucideAngularModule,
  LucideIconData,
  Menu,
  Moon,
  Package,
  Plus,
  Receipt,
  Store,
  Sun,
  Users,
  Wallet,
  X
} from 'lucide-angular';
import { ThemeService } from './core/theme.service';
import { ToastContainerComponent } from './shared/toast-container/toast-container';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: LucideIconData;
  readonly exact?: boolean;
}

interface NavGroup {
  readonly title: string;
  readonly items: readonly NavItem[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly mobileNavOpen = signal(false);

  protected readonly icons = { logo: Hexagon, plus: Plus, menu: Menu, close: X, sun: Sun, moon: Moon };

  protected readonly navGroups: readonly NavGroup[] = [
    {
      title: 'Übersicht',
      items: [{ label: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true }]
    },
    {
      title: 'Verkauf',
      items: [
        { label: 'Verkäufe', path: '/transactions', icon: Receipt, exact: true },
        { label: 'Produkte', path: '/products', icon: Package }
      ]
    },
    {
      title: 'Finanzen',
      items: [{ label: 'Ausgaben', path: '/expenses', icon: Wallet }]
    },
    {
      title: 'Kontakte',
      items: [
        { label: 'Kunden', path: '/customers', icon: Users },
        { label: 'Verkäufer', path: '/sellers', icon: Store }
      ]
    }
  ];

  constructor() {
    // Close the mobile menu after navigating.
    inject(Router)
      .events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.mobileNavOpen.set(false));
  }
}
