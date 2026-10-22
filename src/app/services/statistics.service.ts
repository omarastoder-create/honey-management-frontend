import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api';

export interface PerformerStat {
  readonly name: string;
  readonly totalVolume: number;
}

export interface MonthlyRevenueStat {
  readonly year: number;
  readonly month: number;
  readonly revenue: number;
}

// Field names must match the backend record DashboardStatisticsResponse exactly.
export interface DashboardStatisticsResponse {
  readonly totalRevenue: number;
  readonly totalExpenses: number;
  readonly netProfit: number;
  readonly topCustomerOfMonth: PerformerStat;
  readonly topCustomerOfYear: PerformerStat;
  readonly topSellerOfMonth: PerformerStat;
  readonly topSellerOfYear: PerformerStat;
  readonly monthlySales: readonly MonthlyRevenueStat[];
}

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly http = inject(HttpClient);
  private readonly url = apiUrl('statistics');

  getStatistics(): Observable<DashboardStatisticsResponse> {
    return this.http.get<DashboardStatisticsResponse>(this.url);
  }
}
