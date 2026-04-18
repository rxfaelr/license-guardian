export type LicenseStatus = "valid" | "renewing" | "expired" | "missing";

export interface LicenseType {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  cnpj?: string;
  email: string;
  phone?: string;
  address?: string;
  contactName?: string;
  /** Sequence of LicenseType IDs the supplier must keep updated */
  requiredLicenseTypeIds: string[];
  /** Password set on first access (demo only — plain text in localStorage) */
  password?: string;
  createdAt: string;
}

export interface LicenseDocument {
  id: string;
  supplierId: string;
  licenseTypeId: string;
  issueDate: string; // ISO
  expiryDate: string; // ISO
  fileName: string;
  fileDataUrl: string; // base64 PDF
  uploadedAt: string;
}

export type SessionRole = "admin" | "supplier";

export interface Session {
  role: SessionRole;
  supplierId?: string;
  email: string;
}
