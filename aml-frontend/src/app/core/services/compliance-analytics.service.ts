import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ComplianceAnalyticsData {
  // KPIs
  totalAlerts: number;
  openAlerts: number;
  escalatedAlerts: number;
  resolvedAlerts: number;
  activeCases: number;
  resolvedCases: number;
  averageResponseTime: number; // in hours
  slaComplianceRate: number; // percentage
  
  // Alert Analytics
  alertTrends: { date: string; open: number; escalated: number; resolved: number }[];
  alertsByRisk: { level: string; count: number }[];
  alertsByType: { type: string; count: number }[];
  topAlertTriggers: { ruleName: string; count: number; action: string }[];
  recentAlerts: { id: number; transactionId: number; reason: string; riskScore: number; status: string; createdAt: string }[];
  
  // Case Analytics
  caseStatusDistribution: { status: string; count: number }[];
  casesByOfficer: { officer: string; active: number; resolved: number }[];
  caseResolutionTime: { date: string; avgHours: number }[];
  caseOutcomes: { outcome: string; count: number }[];
  
  // Transaction Review Analytics
  flaggedTransactions: number;
  blockedTransactions: number;
  reviewedTransactions: number;
  transactionReviewOutcomes: { outcome: string; count: number }[];
  highRiskTransactions: { id: number; amount: number; currency: string; riskScore: number; status: string }[];
  
  // Performance Metrics
  alertResponseTimes: { date: string; avgHours: number }[];
  officerPerformance: { officer: string; alertsReviewed: number; casesResolved: number; avgResponseTime: number }[];
  
  // Risk Metrics
  riskDistribution: { level: string; count: number }[];
  riskTrends: { date: string; high: number; medium: number; low: number }[];
  highRiskCustomers: { customerId: number; customerName: string; riskScore: number; alertCount: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class ComplianceAnalyticsService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getComplianceAnalytics(): Observable<ComplianceAnalyticsData> {
    return forkJoin({
      alerts: this.http.get<any[]>(`${this.apiUrl}/compliance/alerts`).pipe(catchError((err) => {
        console.error('Error fetching alerts:', err);
        return of([]);
      })),
      casesActive: this.http.get<any[]>(`${this.apiUrl}/compliance/cases/under-investigation`).pipe(catchError((err) => {
        console.error('Error fetching active cases:', err);
        return of([]);
      })),
      casesResolved: this.http.get<any[]>(`${this.apiUrl}/compliance/cases/resolved`).pipe(catchError((err) => {
        console.error('Error fetching resolved cases:', err);
        return of([]);
      })),
      flaggedTxns: this.http.get<any[]>(`${this.apiUrl}/compliance/transactions/flagged`).pipe(catchError((err) => {
        console.error('Error fetching flagged transactions:', err);
        return of([]);
      })),
      blockedTxns: this.http.get<any[]>(`${this.apiUrl}/compliance/transactions/blocked`).pipe(catchError((err) => {
        console.error('Error fetching blocked transactions:', err);
        return of([]);
      })),
      reviewTxns: this.http.get<any[]>(`${this.apiUrl}/compliance/transactions/review`).pipe(catchError((err) => {
        console.error('Error fetching review transactions:', err);
        return of([]);
      }))
    }).pipe(
      map(data => {
        console.log('Raw compliance data received:', data);
        return this.processComplianceData(data);
      })
    );
  }

  private processComplianceData(data: any): ComplianceAnalyticsData {
    const alerts = data.alerts || [];
    const casesActive = data.casesActive || [];
    const casesResolved = data.casesResolved || [];
    const allCases = [...casesActive, ...casesResolved];
    const flaggedTxns = data.flaggedTxns || [];
    const blockedTxns = data.blockedTxns || [];
    const reviewTxns = data.reviewTxns || [];
    const allTransactions = [...flaggedTxns, ...blockedTxns, ...reviewTxns];

    return {
      // KPIs
      totalAlerts: alerts.length,
      openAlerts: alerts.filter((a: any) => a.status === 'OPEN').length,
      escalatedAlerts: alerts.filter((a: any) => a.status === 'ESCALATED').length,
      resolvedAlerts: alerts.filter((a: any) => a.status === 'RESOLVED').length,
      activeCases: casesActive.length,
      resolvedCases: casesResolved.length,
      averageResponseTime: this.calculateAverageResponseTime(alerts),
      slaComplianceRate: this.calculateSLACompliance(alerts),
      
      // Alert Analytics
      alertTrends: this.calculateAlertTrends(alerts),
      alertsByRisk: this.groupAlertsByRisk(alerts),
      alertsByType: this.groupAlertsByType(alerts),
      topAlertTriggers: this.getTopAlertTriggers(alerts),
      recentAlerts: this.getRecentAlerts(alerts),
      
      // Case Analytics
      caseStatusDistribution: this.groupCasesByStatus(allCases),
      casesByOfficer: this.groupCasesByOfficer(allCases),
      caseResolutionTime: this.calculateCaseResolutionTime(casesResolved),
      caseOutcomes: this.getCaseOutcomes(casesResolved),
      
      // Transaction Review Analytics
      flaggedTransactions: flaggedTxns.length,
      blockedTransactions: blockedTxns.length,
      reviewedTransactions: reviewTxns.length,
      transactionReviewOutcomes: this.getTransactionOutcomes(allTransactions),
      highRiskTransactions: this.getHighRiskTransactions(allTransactions),
      
      // Performance Metrics
      alertResponseTimes: this.calculateAlertResponseTimes(alerts),
      officerPerformance: this.calculateOfficerPerformance(allCases, alerts),
      
      // Risk Metrics
      riskDistribution: this.calculateRiskDistribution(allTransactions),
      riskTrends: this.calculateRiskTrends(allTransactions),
      highRiskCustomers: this.getHighRiskCustomers(allTransactions)
    };
  }

  // Alert Analytics Methods
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

  private groupAlertsByRisk(alerts: any[]): any[] {
    const high = alerts.filter(a => (a.riskScore || 0) >= 80).length;
    const medium = alerts.filter(a => (a.riskScore || 0) >= 60 && (a.riskScore || 0) < 80).length;
    const low = alerts.filter(a => (a.riskScore || 0) < 60).length;
    
    return [
      { level: 'High Risk (80+)', count: high },
      { level: 'Medium Risk (60-79)', count: medium },
      { level: 'Low Risk (<60)', count: low }
    ];
  }

  private groupAlertsByType(alerts: any[]): any[] {
    const grouped = alerts.reduce((acc, a) => {
      const type = a.reason || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([type, count]) => ({ type, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopAlertTriggers(alerts: any[]): any[] {
    // Extract rules from alert transactions
    const ruleMap = new Map();
    
    alerts.forEach(a => {
      if (a.transaction && a.transaction.obstructedRules) {
        a.transaction.obstructedRules.forEach((rule: any) => {
          const key = rule.ruleName || 'Unknown Rule';
          if (!ruleMap.has(key)) {
            ruleMap.set(key, { ruleName: key, count: 0, action: rule.action || 'FLAG' });
          }
          ruleMap.get(key).count++;
        });
      }
    });
    
    return Array.from(ruleMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getRecentAlerts(alerts: any[]): any[] {
    return alerts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        transactionId: a.transactionId,
        reason: a.reason,
        riskScore: a.riskScore,
        status: a.status,
        createdAt: a.createdAt
      }));
  }

  // Case Analytics Methods
  private groupCasesByStatus(cases: any[]): any[] {
    const grouped = cases.reduce((acc, c) => {
      const status = c.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([status, count]) => ({ status, count }));
  }

  private groupCasesByOfficer(cases: any[]): any[] {
    const officerMap = new Map();
    
    cases.forEach(c => {
      const officer = c.assignedTo?.username || 'Unassigned';
      if (!officerMap.has(officer)) {
        officerMap.set(officer, { officer, active: 0, resolved: 0 });
      }
      const data = officerMap.get(officer);
      if (c.status === 'UNDER_INVESTIGATION') data.active++;
      if (c.status === 'RESOLVED') data.resolved++;
    });
    
    return Array.from(officerMap.values());
  }

  private calculateCaseResolutionTime(cases: any[]): any[] {
    const last7Days = this.getLast7Days();
    const timeMap = new Map();
    
    last7Days.forEach(date => {
      timeMap.set(date, { total: 0, count: 0 });
    });
    
    cases.forEach(c => {
      const date = this.safeFormatDate(c.updatedAt);
      if (date && timeMap.has(date) && c.createdAt && c.updatedAt) {
        try {
          const hours = (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
          const data = timeMap.get(date);
          data.total += hours;
          data.count++;
        } catch (e) {
          console.warn('Invalid date in case:', c);
        }
      }
    });
    
    return Array.from(timeMap.entries()).map(([date, data]) => ({
      date,
      avgHours: data.count > 0 ? Math.round(data.total / data.count) : 0
    }));
  }

  private getCaseOutcomes(cases: any[]): any[] {
    const outcomes = cases.reduce((acc, c) => {
      const outcome = c.outcome || 'Pending';
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(outcomes).map(([outcome, count]) => ({ outcome, count }));
  }

  // Transaction Review Methods
  private getTransactionOutcomes(transactions: any[]): any[] {
    const grouped = transactions.reduce((acc, t) => {
      const status = t.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([outcome, count]) => ({ outcome, count }));
  }

  private getHighRiskTransactions(transactions: any[]): any[] {
    return transactions
      .filter(t => (t.combinedRiskScore || 0) >= 70)
      .sort((a, b) => (b.combinedRiskScore || 0) - (a.combinedRiskScore || 0))
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        amount: t.amount,
        currency: t.currency,
        riskScore: t.combinedRiskScore,
        status: t.status
      }));
  }

  // Performance Metrics
  private calculateAverageResponseTime(alerts: any[]): number {
    const responseTimes = alerts
      .filter(a => a.updatedAt && a.createdAt)
      .map(a => {
        const created = new Date(a.createdAt).getTime();
        const updated = new Date(a.updatedAt).getTime();
        return (updated - created) / (1000 * 60 * 60); // hours
      });
    
    if (responseTimes.length === 0) return 0;
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    return Math.round((sum / responseTimes.length) * 10) / 10;
  }

  private calculateSLACompliance(alerts: any[]): number {
    const SLA_HOURS = 24; // 24 hour SLA
    const withinSLA = alerts.filter(a => {
      if (!a.updatedAt || !a.createdAt) return false;
      const hours = (new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
      return hours <= SLA_HOURS;
    }).length;
    
    return alerts.length > 0 ? Math.round((withinSLA / alerts.length) * 100) : 100;
  }

  private calculateAlertResponseTimes(alerts: any[]): any[] {
    const last7Days = this.getLast7Days();
    const timeMap = new Map();
    
    last7Days.forEach(date => {
      timeMap.set(date, { total: 0, count: 0 });
    });
    
    alerts.forEach(a => {
      const date = this.safeFormatDate(a.createdAt);
      if (date && timeMap.has(date) && a.updatedAt && a.createdAt) {
        try {
          const hours = (new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
          const data = timeMap.get(date);
          data.total += hours;
          data.count++;
        } catch (e) {
          console.warn('Invalid date in alert:', a);
        }
      }
    });
    
    return Array.from(timeMap.entries()).map(([date, data]) => ({
      date,
      avgHours: data.count > 0 ? Math.round(data.total / data.count) : 0
    }));
  }

  private calculateOfficerPerformance(cases: any[], alerts: any[]): any[] {
    const officerMap = new Map();
    
    // Count cases per officer
    cases.forEach(c => {
      const officer = c.assignedTo?.username || 'Unassigned';
      if (!officerMap.has(officer)) {
        officerMap.set(officer, { officer, alertsReviewed: 0, casesResolved: 0, totalResponseTime: 0, count: 0 });
      }
      const data = officerMap.get(officer);
      if (c.status === 'RESOLVED') {
        data.casesResolved++;
        if (c.createdAt && c.updatedAt) {
          const hours = (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
          data.totalResponseTime += hours;
          data.count++;
        }
      }
    });
    
    // Count alerts reviewed (approximate)
    alerts.filter(a => a.status !== 'OPEN').forEach(a => {
      const officer = 'System'; // We don't have officer info in alerts, so use placeholder
      if (!officerMap.has(officer)) {
        officerMap.set(officer, { officer, alertsReviewed: 0, casesResolved: 0, totalResponseTime: 0, count: 0 });
      }
      officerMap.get(officer).alertsReviewed++;
    });
    
    return Array.from(officerMap.values()).map(data => ({
      officer: data.officer,
      alertsReviewed: data.alertsReviewed,
      casesResolved: data.casesResolved,
      avgResponseTime: data.count > 0 ? Math.round(data.totalResponseTime / data.count) : 0
    }));
  }

  // Risk Metrics
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

  private getHighRiskCustomers(transactions: any[]): any[] {
    const customerMap = new Map();
    
    transactions.forEach(t => {
      if (!t.fromAccount) return;
      const customerId = t.fromAccount.user?.id || 0;
      const customerName = t.fromAccount.user?.username || 'Unknown';
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName,
          totalRisk: 0,
          count: 0,
          alertCount: 0
        });
      }
      
      const data = customerMap.get(customerId);
      data.totalRisk += (t.combinedRiskScore || 0);
      data.count++;
      if ((t.combinedRiskScore || 0) >= 70) data.alertCount++;
    });
    
    return Array.from(customerMap.values())
      .map(data => ({
        customerId: data.customerId,
        customerName: data.customerName,
        riskScore: Math.round(data.totalRisk / data.count),
        alertCount: data.alertCount
      }))
      .filter(c => c.riskScore >= 60)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
  }

  // Utility Methods
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

  private getLast7Days(): string[] {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  }
}
