// Account Service Models

export interface CreateAccountRequest {
  accountType: 'SAVINGS' | 'CURRENT';
  initialBalance?: number;
  currency: string;
}

export interface AccountDto {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  approvalStatus: string;
  createdAt?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  suspendedAt?: string | null;
  activatedAt?: string | null;
  user?: {
    id: number;
    username: string;
    role: string;
  };
}
