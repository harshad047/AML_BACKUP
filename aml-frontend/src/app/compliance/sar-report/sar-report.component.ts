import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ComplianceService } from '../../core/services/compliance.service';
import { TransactionDto } from '../../core/models/compliance.models';

interface SARReport {
  reportId: string;
  date: Date;
  preparedBy: string;
  transaction: TransactionDto;
  summary: string;
  analysisObservations: string[];
}

@Component({
  selector: 'app-sar-report',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sar-report.component.html',
  styleUrls: ['./sar-report.component.css']
})
export class SarReportComponent implements OnInit {
  loading = false;
  error: string | null = null;
  transaction: TransactionDto | null = null;
  sarReport: SARReport | null = null;
  currentUser = 'Harshad Pachani'; // This should come from auth service

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private complianceService: ComplianceService
  ) {}

  ngOnInit(): void {
    const transactionId = this.route.snapshot.paramMap.get('id');
    if (transactionId) {
      this.loadTransactionAndGenerateReport(+transactionId);
    }
  }

  loadTransactionAndGenerateReport(transactionId: number): void {
    this.loading = true;
    this.error = null;

    // Load transaction details
    this.complianceService.getAllTransactions().subscribe({
      next: (transactions) => {
        this.transaction = transactions.find(t => t.id === transactionId) || null;
        
        if (this.transaction) {
          this.generateSARReport(this.transaction);
        } else {
          this.error = 'Transaction not found';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading transaction:', err);
        this.error = 'Failed to load transaction details';
        this.loading = false;
      }
    });
  }

  generateSARReport(transaction: TransactionDto): void {
    const reportId = `SAR-${new Date().getFullYear()}-${String(transaction.id).padStart(3, '0')}`;
    
    // Generate summary based on transaction details
    const summary = this.generateSummary(transaction);
    
    // Generate analysis and observations
    const analysisObservations = this.generateAnalysisObservations(transaction);

    this.sarReport = {
      reportId,
      date: new Date(),
      preparedBy: this.currentUser,
      transaction,
      summary,
      analysisObservations
    };
  }

  generateSummary(transaction: TransactionDto): string {
    const riskLevel = this.getRiskLevel(transaction.combinedRiskScore || 0);
    const actionType = transaction.status === 'BLOCKED' ? 'blocked' : 'flagged';
    
    let summary = `This transaction was automatically ${actionType} by the AML Rule Engine due to multiple risk indicators. `;
    
    if (transaction.obstructedRules && transaction.obstructedRules.length > 0) {
      summary += `The transaction triggered ${transaction.obstructedRules.length} rule(s), indicating potential suspicious activity. `;
    }
    
    if (transaction.description && transaction.description.toLowerCase().includes('hawala')) {
      summary += 'The transaction appears to involve a potential hawala-related deposit, which may indicate money laundering or unregulated money transfer activities. ';
    }
    
    if (transaction.combinedRiskScore && transaction.combinedRiskScore >= 80) {
      summary += 'The high combined risk score suggests significant compliance concerns that require immediate attention and enhanced due diligence.';
    }
    
    return summary;
  }

  generateAnalysisObservations(transaction: TransactionDto): string[] {
    const observations: string[] = [];
    
    // Enhanced Due Diligence recommendation
    if (transaction.toAccountNumber) {
      observations.push(`Conduct Enhanced Due Diligence (EDD) on account ${transaction.toAccountNumber}, including flag in systems.`);
    }
    
    // Source of funds verification
    if (transaction.fromAccountNumber) {
      observations.push(`Verify the source of funds and beneficiary identity. Review for patterns consistent with layering or placement phases of money laundering.`);
    }
    
    // Pattern analysis
    if (transaction.combinedRiskScore && transaction.combinedRiskScore >= 70) {
      observations.push('High balance-to-transaction ratio and patterned movement of funds suggest multiple high-weight rules were triggered.');
    }
    
    // Risk score analysis
    const nlpScore = transaction.nlpScore || 0;
    const ruleScore = transaction.ruleEngineScore || 0;
    const combinedScore = transaction.combinedRiskScore || 0;
    
    if (nlpScore > 0 && ruleScore > 0) {
      observations.push(`Combination of semantic (NLP: ${nlpScore}) and rule-based (Rule Engine: ${ruleScore}) triggers resulted in a final risk score of ${combinedScore}/100. Automatic action: transaction pending, requiring investigation.`);
    }
    
    // Regulatory recommendation
    if (transaction.status === 'BLOCKED' || (transaction.combinedRiskScore && transaction.combinedRiskScore >= 80)) {
      observations.push('Consider filing a Suspicious Activity Report (SAR) with the Financial Intelligence Unit (FIU) if investigation confirms suspicious patterns.');
    }
    
    return observations;
  }

  getRiskLevel(riskScore: number): string {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  getRiskLevelClass(riskScore: number): string {
    if (riskScore >= 80) return 'risk-critical';
    if (riskScore >= 60) return 'risk-high';
    if (riskScore >= 40) return 'risk-medium';
    return 'risk-low';
  }

  getActionBadgeClass(action: string): string {
    return action === 'BLOCK' ? 'bg-danger' : 'bg-warning';
  }

  printReport(): void {
    window.print();
  }

  downloadReport(): void {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const reportContent = document.getElementById('sar-report-content');
      if (reportContent) {
        printWindow.document.write(`
          <html>
            <head>
              <title>SAR Report - ${this.sarReport?.reportId}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .report-header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .section { margin-bottom: 30px; }
                .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                table, th, td { border: 1px solid #ddd; }
                th, td { padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .bg-warning { background-color: #ffc107; color: #000; }
                .bg-danger { background-color: #dc3545; color: #fff; }
                ul { margin-left: 20px; }
                li { margin-bottom: 10px; }
              </style>
            </head>
            <body>
              ${reportContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/compliance/transactions']);
  }
}
