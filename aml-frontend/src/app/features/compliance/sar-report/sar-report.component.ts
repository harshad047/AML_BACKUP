import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ComplianceService } from '../../../core/services/compliance.service';
import { TransactionDto } from '../../../shared/models/compliance.models';
import { AuthService } from '../../../core/services/auth.service';

interface SARReport {
  reportId: string;
  filingDate: Date;
  reportingPeriod: { start: Date; end: Date };
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
  transaction: TransactionDto;
  
  // Part I - Subject Information
  subjectInfo: {
    accountNumber: string;
    accountType: string;
    accountHolder: string;
    dateOpened: string;
    currentBalance: string;
  };
  
  // Part II - Suspicious Activity Information
  suspiciousActivity: {
    activityType: string[];
    dateDetected: Date;
    amountInvolved: number;
    currency: string;
    summary: string;
  };
  
  // Part III - Narrative
  narrative: {
    description: string;
    timeline: { date: Date; event: string }[];
    redFlags: string[];
  };
  
  // Part IV - Risk Assessment
  riskAssessment: {
    overallRiskLevel: string;
    riskScore: number;
    nlpScore: number;
    ruleEngineScore: number;
    triggeredRules: any[];
  };
  
  // Part V - Analysis & Recommendations
  analysis: {
    observations: string[];
    recommendations: string[];
    regulatoryAction: string;
  };
  
  // Part VI - Supporting Documentation
  supportingDocs: {
    transactionRecords: boolean;
    accountStatements: boolean;
    customerDueDiligence: boolean;
    otherDocuments: string[];
  };
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
  currentUser = ''; // This should come from auth service
  reviewedBy = 'Senior Compliance Officer';
  approvedBy = 'Chief Compliance Officer';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private complianceService: ComplianceService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || user.email || 'User';
      this.currentUser = displayName;
    }
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
    const reportId = `SAR-${new Date().getFullYear()}-${String(transaction.id).padStart(6, '0')}`;
    const filingDate = new Date();
    const reportingPeriod = {
      start: new Date(transaction.createdAt),
      end: new Date()
    };

    this.sarReport = {
      reportId,
      filingDate,
      reportingPeriod,
      preparedBy: this.currentUser,
      reviewedBy: this.reviewedBy,
      approvedBy: this.approvedBy,
      transaction,
      
      subjectInfo: this.generateSubjectInfo(transaction),
      suspiciousActivity: this.generateSuspiciousActivityInfo(transaction),
      narrative: this.generateNarrative(transaction),
      riskAssessment: this.generateRiskAssessment(transaction),
      analysis: this.generateAnalysis(transaction),
      supportingDocs: this.generateSupportingDocs(transaction)
    };
  }

  generateSubjectInfo(transaction: TransactionDto): any {
    return {
      accountNumber: transaction.toAccountNumber || 'N/A',
      accountType: 'Savings Account',
      accountHolder: 'Account Holder Name',
      dateOpened: 'To be verified',
      currentBalance: 'To be verified'
    };
  }

  generateSuspiciousActivityInfo(transaction: TransactionDto): any {
    const activityTypes = [];
    
    if (transaction.description?.toLowerCase().includes('hawala')) {
      activityTypes.push('Suspected Hawala Transaction');
      activityTypes.push('Unregistered Money Service Business');
    }
    if (transaction.combinedRiskScore && transaction.combinedRiskScore >= 80) {
      activityTypes.push('Structuring/Smurfing');
      activityTypes.push('Unusual Transaction Pattern');
    }
    if (transaction.status === 'BLOCKED') {
      activityTypes.push('High-Risk Transaction');
    }
    
    return {
      activityType: activityTypes.length > 0 ? activityTypes : ['Suspicious Transaction'],
      dateDetected: new Date(transaction.createdAt),
      amountInvolved: transaction.amount,
      currency: transaction.currency,
      summary: this.generateSummary(transaction)
    };
  }

  generateNarrative(transaction: TransactionDto): any {
    const timeline = [
      {
        date: new Date(transaction.createdAt),
        event: `Transaction initiated: ${transaction.transactionType} of ${transaction.amount} ${transaction.currency}`
      },
      {
        date: new Date(transaction.createdAt),
        event: `AML Rule Engine triggered ${transaction.obstructedRules?.length || 0} rule(s)`
      },
      {
        date: new Date(),
        event: `Transaction ${transaction.status} - SAR report generated`
      }
    ];

    const redFlags = [];
    if (transaction.description?.toLowerCase().includes('hawala')) {
      redFlags.push('Transaction description contains keywords associated with informal value transfer systems (Hawala)');
    }
    if (transaction.combinedRiskScore && transaction.combinedRiskScore >= 80) {
      redFlags.push(`Extremely high combined risk score (${transaction.combinedRiskScore}/100) indicating multiple risk factors`);
    }
    if (transaction.obstructedRules && transaction.obstructedRules.length >= 3) {
      redFlags.push(`Multiple AML rules triggered (${transaction.obstructedRules.length} rules) suggesting systematic suspicious pattern`);
    }
    if (transaction.amount >= 10000) {
      redFlags.push('Transaction amount exceeds reporting threshold');
    }

    return {
      description: this.generateDetailedNarrative(transaction),
      timeline,
      redFlags: redFlags.length > 0 ? redFlags : ['Unusual transaction pattern detected']
    };
  }

  generateDetailedNarrative(transaction: TransactionDto): string {
    let narrative = `On ${new Date(transaction.createdAt).toLocaleDateString()}, our automated AML monitoring system detected a suspicious transaction (Ref: ${transaction.transactionReference}) `;
    narrative += `involving a ${transaction.transactionType.toLowerCase()} of ${transaction.amount} ${transaction.currency}. `;
    
    if (transaction.fromAccountNumber) {
      narrative += `The transaction originated from account ${transaction.fromAccountNumber} `;
    }
    narrative += `and was directed to account ${transaction.toAccountNumber}. `;
    
    narrative += `\n\nThe transaction was automatically flagged by our multi-layered AML detection system, which combines Natural Language Processing (NLP Score: ${transaction.nlpScore || 0}/100) `;
    narrative += `and rule-based analysis (Rule Engine Score: ${transaction.ruleEngineScore || 0}/100), resulting in a combined risk score of ${transaction.combinedRiskScore || 0}/100. `;
    
    if (transaction.description) {
      narrative += `\n\nThe transaction description reads: "${transaction.description}". `;
      if (transaction.description.toLowerCase().includes('hawala')) {
        narrative += `This description contains terminology commonly associated with informal value transfer systems (Hawala), which are often used to circumvent formal banking channels and may indicate money laundering or terrorist financing activities. `;
      }
    }
    
    narrative += `\n\nBased on the risk assessment, the transaction was automatically ${transaction.status.toLowerCase()} pending compliance review. `;
    narrative += `This action was taken in accordance with our AML policies and regulatory obligations under the Bank Secrecy Act (BSA) and USA PATRIOT Act.`;
    
    return narrative;
  }

  generateRiskAssessment(transaction: TransactionDto): any {
    return {
      overallRiskLevel: this.getRiskLevel(transaction.combinedRiskScore || 0),
      riskScore: transaction.combinedRiskScore || 0,
      nlpScore: transaction.nlpScore || 0,
      ruleEngineScore: transaction.ruleEngineScore || 0,
      triggeredRules: transaction.obstructedRules || []
    };
  }

  generateAnalysis(transaction: TransactionDto): any {
    return {
      observations: this.generateAnalysisObservations(transaction),
      recommendations: this.generateRecommendations(transaction),
      regulatoryAction: this.determineRegulatoryAction(transaction)
    };
  }

  generateRecommendations(transaction: TransactionDto): string[] {
    const recommendations = [];
    
    recommendations.push('Conduct Enhanced Due Diligence (EDD) on the subject account and account holder');
    recommendations.push('Review all historical transactions for the past 12 months for similar patterns');
    recommendations.push('Verify source of funds and beneficial ownership information');
    recommendations.push('Consider account monitoring for a minimum of 90 days');
    
    if (transaction.combinedRiskScore && transaction.combinedRiskScore >= 80) {
      recommendations.push('Recommend immediate filing of SAR with FinCEN within 30 days of initial detection');
      recommendations.push('Consider account restrictions or closure pending investigation outcome');
    }
    
    if (transaction.description?.toLowerCase().includes('hawala')) {
      recommendations.push('Coordinate with law enforcement if evidence of unlicensed money service business');
      recommendations.push('Review for potential terrorist financing indicators');
    }
    
    recommendations.push('Document all findings in the case management system');
    recommendations.push('Update customer risk rating in the system');
    
    return recommendations;
  }

  determineRegulatoryAction(transaction: TransactionDto): string {
    if (transaction.combinedRiskScore && transaction.combinedRiskScore >= 80) {
      return 'RECOMMEND FILING SAR WITH FINCEN - High priority case requiring immediate regulatory reporting within 30 days of detection. Maintain confidentiality per 31 CFR 1020.320.';
    } else if (transaction.combinedRiskScore && transaction.combinedRiskScore >= 60) {
      return 'CONTINUE MONITORING - Escalate to SAR filing if additional suspicious activity is detected within monitoring period.';
    } else {
      return 'ENHANCED MONITORING - Document findings and continue surveillance for 90 days.';
    }
  }

  generateSupportingDocs(transaction: TransactionDto): any {
    return {
      transactionRecords: true,
      accountStatements: true,
      customerDueDiligence: false,
      otherDocuments: [
        'AML Rule Engine Logs',
        'NLP Analysis Report',
        'Transaction Screenshot'
      ]
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

  downloadReport(): void {
    // Trigger browser print dialog which allows saving as PDF
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/compliance/cases']);
  }
}
