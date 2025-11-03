import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface AnalyticsData {
  // Executive Summary
  totalTransactions: number;
  averageRiskScore: number;
  activeAlerts: number;
  complianceRate: number;
  
  // Transaction Analytics
  transactionsByType: { type: string; count: number; amount: number }[];
  transactionsByStatus: { status: string; count: number }[];
  transactionTrends: { date: string; total: number; approved: number; flagged: number; blocked: number }[];
  transactionAmountTrends: { date: string; amount: number; currency: string }[];
  topHighValueTransactions: { id: number; amount: number; riskScore: number; currency: string }[];
  
  // Risk Analytics
  riskDistribution: { level: string; count: number }[];
  riskTrends: { date: string; high: number; medium: number; low: number }[];
  alertTrends: { date: string; open: number; escalated: number; resolved: number }[];
  topTriggeredRules: { ruleName: string; count: number; action: string }[];
  
  // User Analytics
  userGrowth: { month: string; newUsers: number; totalUsers: number }[];
  userStatusDistribution: { status: string; count: number }[];
  kycStatus: { status: string; count: number }[];
  topCustomersByVolume: { name: string; transactions: number; amount: number }[];
  
  // Officer Performance
  casesByOfficer: { officer: string; resolved: number; pending: number }[];
  caseResolutionTime: { date: string; avgDays: number }[];
  caseOutcomes: { outcome: string; count: number }[];
  
  // Country Risk
  transactionsByCountry: { country: string; count: number; riskLevel: string }[];
  
  // Account Analytics
  accountsByType: { type: string; count: number }[];
  accountsByCurrency: { currency: string; count: number }[];
  accountGrowth: { month: string; count: number }[];
  
  // Audit Logs
  activityByAction: { action: string; count: number }[];
  activityByRole: { role: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getAnalyticsData(): Observable<AnalyticsData> {
    return forkJoin({
      transactions: this.http.get<any[]>(`${this.apiUrl}/admin/transactions`).pipe(catchError((err) => {
        console.error('Error fetching transactions:', err);
        return of([]);
      })),
      alerts: this.http.get<any[]>(`${this.apiUrl}/compliance/alerts/all`).pipe(catchError((err) => {
        console.error('Error fetching alerts:', err);
        return of([]);
      })),
      cases: this.http.get<any[]>(`${this.apiUrl}/compliance/cases/under-investigation`).pipe(catchError((err) => {
        console.error('Error fetching cases:', err);
        return of([]);
      })),
      resolvedCases: this.http.get<any[]>(`${this.apiUrl}/compliance/cases/resolved`).pipe(catchError((err) => {
        console.error('Error fetching resolved cases:', err);
        return of([]);
      })),
      users: this.http.get<any[]>(`${this.apiUrl}/admin/users`).pipe(catchError((err) => {
        console.error('Error fetching users:', err);
        return of([]);
      })),
      accounts: this.http.get<any[]>(`${this.apiUrl}/admin/accounts`).pipe(catchError((err) => {
        console.error('Error fetching accounts:', err);
        return of([]);
      })),
      rules: this.http.get<any[]>(`${this.apiUrl}/admin/rules`).pipe(catchError((err) => {
        console.error('Error fetching rules:', err);
        return of([]);
      })),
      auditLogs: this.http.get<any[]>(`${this.apiUrl}/admin/audit-logs`).pipe(catchError((err) => {
        console.error('Error fetching audit logs:', err);
        return of([]);
      }))
    }).pipe(
      map(data => {
        console.log('Raw API data received:', data);
        return this.processAnalyticsData(data);
      })
    );
  }

  private processAnalyticsData(data: any): AnalyticsData {
    const transactions = data.transactions || [];
    const alerts = data.alerts || [];
    const cases = [...(data.cases || []), ...(data.resolvedCases || [])];
    const users = data.users || [];
    const accounts = data.accounts || [];
    const auditLogs = data.auditLogs || [];

    return {
      // Executive Summary
      totalTransactions: transactions.length,
      averageRiskScore: this.calculateAverageRiskScore(transactions),
      activeAlerts: alerts.filter((a: any) => a.status === 'OPEN').length,
      complianceRate: this.calculateComplianceRate(transactions),
      
      // Transaction Analytics
      transactionsByType: this.groupTransactionsByType(transactions),
      transactionsByStatus: this.groupTransactionsByStatus(transactions),
      transactionTrends: this.calculateTransactionTrends(transactions),
      transactionAmountTrends: this.calculateAmountTrends(transactions),
      topHighValueTransactions: this.getTopHighValueTransactions(transactions),
      
      // Risk Analytics
      riskDistribution: this.calculateRiskDistribution(transactions),
      riskTrends: this.calculateRiskTrends(transactions),
      alertTrends: this.calculateAlertTrends(alerts),
      topTriggeredRules: this.getTopTriggeredRules(transactions),
      
      // User Analytics
      userGrowth: this.calculateUserGrowth(users),
      userStatusDistribution: this.getUserStatusDistribution(users),
      kycStatus: this.getKycStatus(users),
      topCustomersByVolume: this.getTopCustomersByVolume(transactions, users),
      
      // Officer Performance
      casesByOfficer: this.groupCasesByOfficer(cases),
      caseResolutionTime: this.calculateResolutionTime(cases),
      caseOutcomes: this.getCaseOutcomes(cases),
      
      // Country Risk
      transactionsByCountry: this.groupTransactionsByCountry(transactions),
      
      // Account Analytics
      accountsByType: this.groupAccountsByType(accounts),
      accountsByCurrency: this.groupAccountsByCurrency(accounts),
      accountGrowth: this.calculateAccountGrowth(accounts),
      
      // Audit Logs
      activityByAction: this.groupActivityByAction(auditLogs),
      activityByRole: this.groupActivityByRole(auditLogs)
    };
  }

  private calculateAverageRiskScore(transactions: any[]): number {
    if (!transactions.length) return 0;
    const sum = transactions.reduce((acc, t) => acc + (t.combinedRiskScore || 0), 0);
    return Math.round(sum / transactions.length);
  }

  private calculateComplianceRate(transactions: any[]): number {
    if (!transactions.length) return 100;
    const approved = transactions.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
    return Math.round((approved / transactions.length) * 100);
  }

  private groupTransactionsByType(transactions: any[]): any[] {
    const grouped = transactions.reduce((acc, t) => {
      const type = t.transactionType || 'UNKNOWN';
      if (!acc[type]) acc[type] = { count: 0, amount: 0 };
      acc[type].count++;
      acc[type].amount += t.amount || 0;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([type, data]: [string, any]) => ({
      type,
      count: data.count,
      amount: Math.round(data.amount)
    }));
  }

  private groupTransactionsByStatus(transactions: any[]): any[] {
    const grouped = transactions.reduce((acc, t) => {
      const status = t.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([status, count]) => ({ status, count }));
  }

  private calculateTransactionTrends(transactions: any[]): any[] {
    const last7Days = this.getLast7Days();
    const trendMap = new Map();
    
    last7Days.forEach(date => {
      trendMap.set(date, { total: 0, approved: 0, flagged: 0, blocked: 0 });
    });
    
    transactions.forEach(t => {
      const date = this.safeFormatDate(t.createdAt);
      if (date && trendMap.has(date)) {
        const trend = trendMap.get(date);
        trend.total++;
        if (t.status === 'APPROVED' || t.status === 'COMPLETED') trend.approved++;
        if (t.status === 'FLAGGED') trend.flagged++;
        if (t.status === 'BLOCKED') trend.blocked++;
      }
    });
    
    return Array.from(trendMap.entries()).map(([date, data]) => ({ date, ...data }));
  }

  private calculateAmountTrends(transactions: any[]): any[] {
    const last7Days = this.getLast7Days();
    const trendMap = new Map();
    
    last7Days.forEach(date => {
      trendMap.set(date, 0);
    });
    
    transactions.forEach(t => {
      const date = this.safeFormatDate(t.createdAt);
      if (date && trendMap.has(date)) {
        trendMap.set(date, trendMap.get(date) + (t.amount || 0));
      }
    });
    
    return Array.from(trendMap.entries()).map(([date, amount]) => ({
      date,
      amount: Math.round(amount),
      currency: 'USD'
    }));
  }

  private getTopHighValueTransactions(transactions: any[]): any[] {
    return transactions
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        amount: t.amount,
        riskScore: t.combinedRiskScore || 0,
        currency: t.currency || 'USD'
      }));
  }

  private calculateRiskDistribution(transactions: any[]): any[] {
    const high = transactions.filter(t => (t.combinedRiskScore || 0) >= 80).length;
    const medium = transactions.filter(t => (t.combinedRiskScore || 0) >= 60 && (t.combinedRiskScore || 0) < 80).length;
    const low = transactions.filter(t => (t.combinedRiskScore || 0) < 60).length;
    
    return [
      { level: 'High Risk (80+)', count: high },
      { level: 'Medium Risk (60-79)', count: medium },
      { level: 'Low Risk (<60)', count: low }
    ];
  }

  private calculateRiskTrends(transactions: any[]): any[] {
    const last7Days = this.getLast7Days();
    const trendMap = new Map();
    
    last7Days.forEach(date => {
      trendMap.set(date, { high: 0, medium: 0, low: 0 });
    });
    
    transactions.forEach(t => {
      const date = this.safeFormatDate(t.createdAt);
      if (date && trendMap.has(date)) {
        const trend = trendMap.get(date);
        const risk = t.combinedRiskScore || 0;
        if (risk >= 80) trend.high++;
        else if (risk >= 60) trend.medium++;
        else trend.low++;
      }
    });
    
    return Array.from(trendMap.entries()).map(([date, data]) => ({ date, ...data }));
  }

  private calculateAlertTrends(alerts: any[]): any[] {
    const last7Days = this.getLast7Days();
    const trendMap = new Map();
    
    last7Days.forEach(date => {
      trendMap.set(date, { open: 0, escalated: 0, resolved: 0 });
    });
    
    alerts.forEach(a => {
      const date = this.safeFormatDate(a.createdAt);
      if (date && trendMap.has(date)) {
        const trend = trendMap.get(date);
        if (a.status === 'OPEN') trend.open++;
        if (a.status === 'ESCALATED') trend.escalated++;
        if (a.status === 'RESOLVED') trend.resolved++;
      }
    });
    
    return Array.from(trendMap.entries()).map(([date, data]) => ({ date, ...data }));
  }

  private getTopTriggeredRules(transactions: any[]): any[] {
    const ruleMap = new Map();
    
    transactions.forEach(t => {
      if (t.obstructedRules && Array.isArray(t.obstructedRules)) {
        t.obstructedRules.forEach((rule: any) => {
          const key = rule.ruleName;
          if (!ruleMap.has(key)) {
            ruleMap.set(key, { count: 0, action: rule.action });
          }
          ruleMap.get(key).count++;
        });
      }
    });
    
    return Array.from(ruleMap.entries())
      .map(([ruleName, data]) => ({ ruleName, count: data.count, action: data.action }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateUserGrowth(users: any[]): any[] {
    const monthMap = new Map();
    const last12Months = this.getLast12Months();
    
    last12Months.forEach(month => {
      monthMap.set(month, { newUsers: 0, totalUsers: 0 });
    });
    
    users.forEach(u => {
      const month = this.safeFormatMonth(u.createdAt);
      if (month && monthMap.has(month)) {
        monthMap.get(month).newUsers++;
      }
    });
    
    let cumulative = 0;
    return Array.from(monthMap.entries()).map(([month, data]) => {
      cumulative += data.newUsers;
      return { month, newUsers: data.newUsers, totalUsers: cumulative };
    });
  }

  private getUserStatusDistribution(users: any[]): any[] {
    const active = users.filter(u => !u.blocked && u.isEnabled !== false).length;
    const blocked = users.filter(u => u.blocked).length;
    const pending = users.filter(u => u.kycStatus === 'PENDING').length;
    
    return [
      { status: 'Active', count: active },
      { status: 'Blocked', count: blocked },
      { status: 'Pending KYC', count: pending }
    ];
  }

  private getKycStatus(users: any[]): any[] {
    const grouped = users.reduce((acc, u) => {
      const status = u.kycStatus || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([status, count]) => ({ status, count }));
  }

  private getTopCustomersByVolume(transactions: any[], users: any[]): any[] {
    const userMap = new Map();
    
    transactions.forEach(t => {
      const userId = t.userId || t.customerId;
      if (!userMap.has(userId)) {
        userMap.set(userId, { transactions: 0, amount: 0 });
      }
      const data = userMap.get(userId);
      data.transactions++;
      data.amount += t.amount || 0;
    });
    
    return Array.from(userMap.entries())
      .map(([userId, data]) => {
        const user = users.find(u => u.id === userId);
        return {
          name: user ? `${user.firstName} ${user.lastName}` : `User ${userId}`,
          transactions: data.transactions,
          amount: Math.round(data.amount)
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }

  private groupCasesByOfficer(cases: any[]): any[] {
    console.log('Grouping cases by officer. Total cases:', cases.length);
    console.log('Sample case:', cases[0]);
    
    const officerMap = new Map();
    
    cases.forEach(c => {
      // Try multiple ways to get officer name
      let officer = 'Unassigned';
      
      if (c.assignedTo) {
        if (typeof c.assignedTo === 'string') {
          officer = c.assignedTo;
        } else if (c.assignedTo.username) {
          officer = c.assignedTo.username;
        } else if (c.assignedTo.firstName) {
          officer = `${c.assignedTo.firstName} ${c.assignedTo.lastName || ''}`.trim();
        } else if (c.assignedTo.email) {
          officer = c.assignedTo.email;
        }
      }
      
      console.log(`Case ${c.id}: officer = ${officer}, status = ${c.status}`);
      
      if (!officerMap.has(officer)) {
        officerMap.set(officer, { resolved: 0, pending: 0 });
      }
      const data = officerMap.get(officer);
      if (c.status === 'RESOLVED') data.resolved++;
      else data.pending++;
    });
    
    const result = Array.from(officerMap.entries()).map(([officer, data]) => ({
      officer,
      resolved: data.resolved,
      pending: data.pending
    }));
    
    console.log('Cases by officer result:', result);
    return result;
  }

  private calculateResolutionTime(cases: any[]): any[] {
    const resolvedCases = cases.filter(c => c.status === 'RESOLVED' && c.updatedAt && c.createdAt);
    const last7Days = this.getLast7Days();
    const timeMap = new Map();
    
    last7Days.forEach(date => {
      timeMap.set(date, { total: 0, count: 0 });
    });
    
    resolvedCases.forEach(c => {
      const date = this.safeFormatDate(c.updatedAt);
      if (date && timeMap.has(date) && c.createdAt && c.updatedAt) {
        try {
          const days = Math.ceil((new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          const data = timeMap.get(date);
          data.total += days;
          data.count++;
        } catch (e) {
          console.warn('Invalid date in case resolution:', c);
        }
      }
    });
    
    return Array.from(timeMap.entries()).map(([date, data]) => ({
      date,
      avgDays: data.count > 0 ? Math.round(data.total / data.count) : 0
    }));
  }

  private getCaseOutcomes(cases: any[]): any[] {
    const resolvedCases = cases.filter(c => c.status === 'RESOLVED');
    const outcomes = resolvedCases.reduce((acc, c) => {
      const outcome = c.outcome || 'Unknown';
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(outcomes).map(([outcome, count]) => ({ outcome, count }));
  }

  private groupTransactionsByCountry(transactions: any[]): any[] {
    const countryMap = new Map();
    
    transactions.forEach(t => {
      const country = t.country || 'Unknown';
      if (!countryMap.has(country)) {
        countryMap.set(country, { count: 0, riskLevel: 'LOW' });
      }
      countryMap.get(country).count++;
    });
    
    return Array.from(countryMap.entries())
      .map(([country, data]) => ({ country, count: data.count, riskLevel: data.riskLevel }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }

  private groupAccountsByType(accounts: any[]): any[] {
    const grouped = accounts.reduce((acc, a) => {
      const type = a.accountType || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([type, count]) => ({ type, count }));
  }

  private groupAccountsByCurrency(accounts: any[]): any[] {
    const grouped = accounts.reduce((acc, a) => {
      const currency = a.currency || 'USD';
      acc[currency] = (acc[currency] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([currency, count]) => ({ currency, count }));
  }

  private calculateAccountGrowth(accounts: any[]): any[] {
    const monthMap = new Map();
    const last12Months = this.getLast12Months();
    
    last12Months.forEach(month => {
      monthMap.set(month, 0);
    });
    
    accounts.forEach(a => {
      const month = this.safeFormatMonth(a.createdAt);
      if (month && monthMap.has(month)) {
        monthMap.set(month, monthMap.get(month) + 1);
      }
    });
    
    return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
  }

  private groupActivityByAction(auditLogs: any[]): any[] {
    const grouped = auditLogs.reduce((acc, log) => {
      const action = log.action || 'UNKNOWN';
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([action, count]) => ({ action, count }));
  }

  private groupActivityByRole(auditLogs: any[]): any[] {
    const grouped = auditLogs.reduce((acc, log) => {
      const role = log.userRole || 'UNKNOWN';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([role, count]) => ({ role, count }));
  }

  private safeFormatDate(dateValue: any): string | null {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  }

  private safeFormatMonth(dateValue: any): string | null {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().substring(0, 7);
    } catch (e) {
      return null;
    }
  }

  private getLast7Days(): string[] {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  }

  private getLast30Days(): string[] {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  }

  private getLast12Months(): string[] {
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().substring(0, 7));
    }
    return months;
  }
}
