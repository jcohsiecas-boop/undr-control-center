import { DocumentStatus, FinancialType, PaymentStatus } from "@prisma/client";

export function nextPaymentStatus(amount: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return PaymentStatus.PENDING;
  if (paidAmount >= amount) return PaymentStatus.SETTLED;
  return PaymentStatus.PARTIAL;
}

export function nextDocumentStatus(type: FinancialType, current: DocumentStatus, paymentStatus: PaymentStatus): DocumentStatus {
  if (paymentStatus === PaymentStatus.SETTLED) return type === FinancialType.INCOME ? DocumentStatus.COLLECTED : DocumentStatus.PAID;
  if (paymentStatus === PaymentStatus.PARTIAL) return type === FinancialType.INCOME ? DocumentStatus.PARTIALLY_COLLECTED : DocumentStatus.PARTIALLY_PAID;
  return current;
}

export function defaultDocumentStatus(type: FinancialType, projected: boolean): DocumentStatus {
  if (projected) return DocumentStatus.PROJECTED;
  return type === FinancialType.INCOME ? DocumentStatus.CONFIRMED : DocumentStatus.APPROVED;
}
