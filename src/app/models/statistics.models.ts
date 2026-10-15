export interface PerformerStat {
  name: string;
  totalVolume: number;
}

export interface MonthlyRevenueStat {
  year: number;
  month: number;
  revenue: number;
}

export interface DashboardStatisticsResponse {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  topCustomerMonth: PerformerStat;
  topCustomerYear: PerformerStat;
  topSellerMonth: PerformerStat;
  topSellerYear: PerformerStat;
  monthlySales: MonthlyRevenueStat[];
}