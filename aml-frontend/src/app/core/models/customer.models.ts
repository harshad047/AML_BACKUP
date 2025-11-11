// Customer Service Models

export interface CustomerProfileDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone?: string;
  kycStatus?: string;
}
