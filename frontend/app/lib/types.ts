export type UserRole = 'customer' | 'sales' | 'warehouse' | 'legal';

export type ApplicationStatus =
  | 'draft'
  | 'pending_sales_review'
  | 'pending_legal_review'
  | 'sales_rejected'
  | 'legal_rejected'
  | 'approved'
  | 'pending_shipment'
  | 'shipped'
  | 'in_testing'
  | 'pending_return'
  | 'returning'
  | 'inspecting'
  | 'completed'
  | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  phone?: string;
  createdAt: string;
}

export interface Sample {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  description?: string;
  value: number;
  depositAmount: number;
  status: string;
  createdAt: string;
}

export interface Application {
  id: string;
  applicationNo: string;
  customerId: string;
  sampleId: string;
  targetCountry: string;
  testPurpose: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: ApplicationStatus;
  salesReviewComment?: string;
  legalReviewComment?: string;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  sample?: Sample;
  salesReviewer?: User;
  legalReviewer?: User;
  deposit?: Deposit;
  logistics?: Logistics[];
  feedback?: Feedback;
  returnInspection?: ReturnInspection;
  contract?: Contract;
}

export interface Deposit {
  id: string;
  applicationId: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunding' | 'refunded' | 'deducted';
  paidAt?: string;
  refundedAt?: string;
  deductionReason?: string;
}

export interface Logistics {
  id: string;
  applicationId: string;
  type: 'outbound' | 'return';
  courier: string;
  trackingNo: string;
  status: 'created' | 'shipped' | 'in_transit' | 'delivered';
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  trackingEvents?: Array<{ time: string; location: string; status: string }>;
}

export interface Feedback {
  id: string;
  applicationId: string;
  content: string;
  testResult: 'pass' | 'fail' | 'partial';
  attachments?: string;
  createdAt: string;
}

export interface ReturnInspection {
  id: string;
  applicationId: string;
  condition: 'good' | 'damaged' | 'missing_parts';
  description: string;
  hasDamage: boolean;
  damageDescription?: string;
  inspectorId: string;
  inspectedAt: string;
  inspector?: User;
}

export interface Contract {
  id: string;
  applicationId: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  signedAt?: string;
  legalReviewerId?: string;
  legalReviewer?: User;
}

export const statusLabels: Record<ApplicationStatus, string> = {
  draft: '草稿',
  pending_sales_review: '待销售审核',
  pending_legal_review: '待合规审核',
  sales_rejected: '销售已驳回',
  legal_rejected: '合规已驳回',
  approved: '已通过',
  pending_shipment: '待发货',
  shipped: '已发货',
  in_testing: '测试中',
  pending_return: '待归还',
  returning: '归还中',
  inspecting: '验收中',
  completed: '已完成',
  cancelled: '已取消',
};

export const statusColors: Record<ApplicationStatus, string> = {
  draft: 'badge-default',
  pending_sales_review: 'badge-warning',
  pending_legal_review: 'badge-warning',
  sales_rejected: 'badge-danger',
  legal_rejected: 'badge-danger',
  approved: 'badge-info',
  pending_shipment: 'badge-warning',
  shipped: 'badge-info',
  in_testing: 'badge-info',
  pending_return: 'badge-warning',
  returning: 'badge-info',
  inspecting: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-default',
};

export const roleLabels: Record<UserRole, string> = {
  customer: '客户',
  sales: '销售',
  warehouse: '仓库',
  legal: '法务',
};
