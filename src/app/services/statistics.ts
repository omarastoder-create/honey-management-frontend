// src/app/services/statistics.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStatisticsResponse } from '../models/statistics.models';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/statistics';

  getStatistics(): Observable<DashboardStatisticsResponse> {
    return this.http.get<DashboardStatisticsResponse>(this.apiUrl);
  }
}