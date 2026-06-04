export type ProviderKey = 'multicloud' | 'azure' | 'aws' | 'gcp' | 'm365';

export interface Provider {
  key: ProviderKey;
  label: string;
  status: 'active' | 'syncing' | 'error';
}

export interface CostRecord {
  id: string;
  providerId: ProviderKey;
  date: string; // ISO string format
  service: string; // e.g. Compute, Storage, Database, Networking, SaaS
  resource?: string;
  cost: number;
  currency: string;
  tags?: Record<string, string>;
}

export interface Budget {
  id: string;
  providerId: ProviderKey;
  name: string;
  amount: number;
  thresholdPct: number;
  period: 'monthly' | 'quarterly' | 'yearly';
}

export interface Alert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'Budget' | 'Anomaly' | 'Waste';
  title: string;
  message: string;
  value: number;
  threshold?: number;
  status: 'active' | 'acknowledged';
  createdAt: string; // ISO string format
}

export interface Recommendation {
  id: string;
  providerId: ProviderKey;
  title: string;
  description: string;
  monthlySaving: number;
  pctOfSpend: number;
  category: 'rightsizing' | 'cleanup' | 'commitment';
  status: 'pending' | 'applied';
}

export interface DashboardStats {
  totalSpend: number;
  totalBudget: number;
  forecastPct: number;
  savingsFound: number;
  efficiencyScore: number;
  runRate: number; // run rate per day
  recentChartData: Array<{
    name: string;
    actual: number;
    budget: number;
    forecast: number;
  }>;
  serviceDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  providerDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}
