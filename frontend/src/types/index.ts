export type RoleName = 'SYSTEM_ADMIN' | 'ICT_TECHNICIAN' | 'DEPARTMENT_REPRESENTATIVE' | 'AUDITOR';

export type AssetStatus = 'ACTIVE' | 'FAULTY' | 'UNDER_MAINTENANCE' | 'RETIRED' | 'LOST' | 'DISPOSED';

export type MaintenanceType = 'ROUTINE' | 'CORRECTIVE' | 'PREVENTIVE' | 'EMERGENCY';
export type MaintenanceStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface AuthUser {
  sub: string;
  role: RoleName;
  departmentId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: RoleName;
    departmentId: string | null;
  };
}

export interface Asset {
  id: string;
  assetTag: string;
  serialNumber: string | null;
  model: string | null;
  status: AssetStatus;
  cost: number | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  assetType: { id: string; name: string; category: string };
  manufacturer: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  computerSpec: { cpu: string | null; ramGb: number | null; storageGb: number | null; os: string | null } | null;
}

export interface MaintenanceRecord {
  id: string;
  maintenanceType: MaintenanceType;
  status: MaintenanceStatus;
  technicianNotes: string | null;
  recommendations: string | null;
  timeStarted: string | null;
  timeFinished: string | null;
  labourHours: number | null;
  createdAt: string;
  asset: { id: string; assetTag: string; departmentId: string | null; status: AssetStatus };
  technician: { id: string; firstName: string; lastName: string };
  department: { id: string; name: string } | null;
  procedures: { id: string; customLabel: string | null; procedureType: { id: string; name: string; isCustom: boolean } }[];
  parts: { id: string; partName: string; quantity: number; cost: number | null }[];
  attachments: { id: string; type: string; fileName: string; filePath: string; uploadedAt: string }[];
  signatures: { id: string; signerRole: string; signedAt: string; signerUser: { firstName: string; lastName: string } }[];
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface DashboardSummary {
  totalAssets: number;
  underMaintenance: number;
  completedToday: number;
  pendingJobs: number;
  overdueMaintenance: number;
  departments: number;
  technicians: number;
}
