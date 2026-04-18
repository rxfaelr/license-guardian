import type {
  LicenseDocument,
  LicenseStatus,
  LicenseType,
  Session,
  Supplier,
} from "./types";

export const RENEWAL_WINDOW_DAYS = 120;

const KEYS = {
  suppliers: "verdor.suppliers",
  licenseTypes: "verdor.licenseTypes",
  licenses: "verdor.licenses",
  session: "verdor.session",
  seeded: "verdor.seeded.v1",
} as const;

const ADMIN_EMAIL = "admin@verdor.app";
const ADMIN_PASSWORD = "admin123";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  // notify same-tab listeners
  window.dispatchEvent(new CustomEvent("verdor:storage", { detail: { key } }));
}

export const id = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ---------- Seed ---------- */

export function ensureSeed() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(KEYS.seeded)) return;

  const types: LicenseType[] = [
    { id: id(), name: "Licença Ambiental de Operação (LO)", description: "Emitida pelo órgão ambiental estadual.", createdAt: new Date().toISOString() },
    { id: id(), name: "Registro IBAMA", description: "Cadastro Técnico Federal.", createdAt: new Date().toISOString() },
    { id: id(), name: "ANTT — RNTRC", description: "Registro Nacional de Transportadores Rodoviários de Carga.", createdAt: new Date().toISOString() },
    { id: id(), name: "MOPP", description: "Movimentação Operacional de Produtos Perigosos.", createdAt: new Date().toISOString() },
  ];
  write(KEYS.licenseTypes, types);

  const today = new Date();
  const addDays = (d: number) => {
    const x = new Date(today);
    x.setDate(x.getDate() + d);
    return x.toISOString();
  };

  const sup1: Supplier = {
    id: id(),
    companyName: "EcoTransporte Ltda.",
    cnpj: "12.345.678/0001-90",
    email: "contato@ecotransporte.com",
    phone: "(11) 98888-1010",
    address: "Av. das Nações, 1200 — São Paulo/SP",
    contactName: "Mariana Alves",
    requiredLicenseTypeIds: [types[0].id, types[2].id, types[3].id],
    password: "demo123",
    createdAt: new Date().toISOString(),
  };
  const sup2: Supplier = {
    id: id(),
    companyName: "Verde Logística S.A.",
    cnpj: "98.765.432/0001-10",
    email: "compliance@verdelog.com",
    phone: "(21) 97777-2020",
    address: "Rua do Porto, 88 — Rio de Janeiro/RJ",
    contactName: "Rafael Costa",
    requiredLicenseTypeIds: [types[0].id, types[1].id, types[2].id],
    password: "demo123",
    createdAt: new Date().toISOString(),
  };
  const sup3: Supplier = {
    id: id(),
    companyName: "BioCargo Express",
    cnpj: "11.222.333/0001-44",
    email: "ana@biocargo.com",
    phone: "(31) 96666-3030",
    address: "Rod. Fernão Dias, km 12 — Belo Horizonte/MG",
    contactName: "Ana Beatriz",
    requiredLicenseTypeIds: [types[1].id, types[2].id],
    password: "demo123",
    createdAt: new Date().toISOString(),
  };
  write(KEYS.suppliers, [sup1, sup2, sup3]);

  const docs: LicenseDocument[] = [
    {
      id: id(),
      supplierId: sup1.id,
      licenseTypeId: types[0].id,
      issueDate: addDays(-200),
      expiryDate: addDays(400),
      fileName: "LO-ecotransporte.pdf",
      fileDataUrl: "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK",
      uploadedAt: new Date().toISOString(),
    },
    {
      id: id(),
      supplierId: sup1.id,
      licenseTypeId: types[2].id,
      issueDate: addDays(-300),
      expiryDate: addDays(60),
      fileName: "RNTRC-ecotransporte.pdf",
      fileDataUrl: "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK",
      uploadedAt: new Date().toISOString(),
    },
    {
      id: id(),
      supplierId: sup2.id,
      licenseTypeId: types[1].id,
      issueDate: addDays(-500),
      expiryDate: addDays(-15),
      fileName: "IBAMA-verdelog.pdf",
      fileDataUrl: "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK",
      uploadedAt: new Date().toISOString(),
    },
    {
      id: id(),
      supplierId: sup2.id,
      licenseTypeId: types[0].id,
      issueDate: addDays(-100),
      expiryDate: addDays(600),
      fileName: "LO-verdelog.pdf",
      fileDataUrl: "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK",
      uploadedAt: new Date().toISOString(),
    },
  ];
  write(KEYS.licenses, docs);
  window.localStorage.setItem(KEYS.seeded, "1");
}

/* ---------- Suppliers ---------- */
export const getSuppliers = () => read<Supplier[]>(KEYS.suppliers, []);
export const setSuppliers = (s: Supplier[]) => write(KEYS.suppliers, s);
export const upsertSupplier = (s: Supplier) => {
  const list = getSuppliers();
  const i = list.findIndex((x) => x.id === s.id);
  if (i >= 0) list[i] = s;
  else list.push(s);
  setSuppliers(list);
};
export const deleteSupplier = (id: string) => {
  setSuppliers(getSuppliers().filter((s) => s.id !== id));
  setLicenses(getLicenses().filter((l) => l.supplierId !== id));
};
export const getSupplier = (id: string) => getSuppliers().find((s) => s.id === id);
export const findSupplierByEmail = (email: string) =>
  getSuppliers().find((s) => s.email.toLowerCase() === email.toLowerCase());

/* ---------- License types ---------- */
export const getLicenseTypes = () => read<LicenseType[]>(KEYS.licenseTypes, []);
export const setLicenseTypes = (l: LicenseType[]) => write(KEYS.licenseTypes, l);
export const upsertLicenseType = (t: LicenseType) => {
  const list = getLicenseTypes();
  const i = list.findIndex((x) => x.id === t.id);
  if (i >= 0) list[i] = t;
  else list.push(t);
  setLicenseTypes(list);
};
export const deleteLicenseType = (id: string) => {
  setLicenseTypes(getLicenseTypes().filter((t) => t.id !== id));
  // remove from suppliers requirements
  setSuppliers(
    getSuppliers().map((s) => ({
      ...s,
      requiredLicenseTypeIds: s.requiredLicenseTypeIds.filter((x) => x !== id),
    })),
  );
  setLicenses(getLicenses().filter((l) => l.licenseTypeId !== id));
};

/* ---------- Licenses (documents) ---------- */
export const getLicenses = () => read<LicenseDocument[]>(KEYS.licenses, []);
export const setLicenses = (l: LicenseDocument[]) => write(KEYS.licenses, l);
export const upsertLicense = (doc: LicenseDocument) => {
  const list = getLicenses();
  // one document per (supplier, type) — replace
  const filtered = list.filter(
    (l) => !(l.supplierId === doc.supplierId && l.licenseTypeId === doc.licenseTypeId),
  );
  filtered.push(doc);
  setLicenses(filtered);
};
export const deleteLicense = (id: string) =>
  setLicenses(getLicenses().filter((l) => l.id !== id));

export const findLicense = (supplierId: string, licenseTypeId: string) =>
  getLicenses().find(
    (l) => l.supplierId === supplierId && l.licenseTypeId === licenseTypeId,
  );

/* ---------- Status ---------- */
export function statusFor(doc?: LicenseDocument | null): LicenseStatus {
  if (!doc) return "missing";
  const expiry = new Date(doc.expiryDate).getTime();
  const now = Date.now();
  const diffDays = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= RENEWAL_WINDOW_DAYS) return "renewing";
  return "valid";
}

export function statusLabel(s: LicenseStatus): string {
  return {
    valid: "Válida",
    renewing: "Em renovação",
    expired: "Expirada",
    missing: "Pendente",
  }[s];
}

/* ---------- Session ---------- */
export const getSession = (): Session | null => read<Session | null>(KEYS.session, null);
export const setSession = (s: Session | null) => {
  if (s) write(KEYS.session, s);
  else {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(KEYS.session);
      window.dispatchEvent(new CustomEvent("verdor:storage", { detail: { key: KEYS.session } }));
    }
  }
};

export function loginAdmin(email: string, password: string): Session | null {
  if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const s: Session = { role: "admin", email: ADMIN_EMAIL };
    setSession(s);
    return s;
  }
  return null;
}

export function loginSupplier(email: string, password: string): Session | null {
  const s = findSupplierByEmail(email);
  if (!s) return null;
  if (!s.password) return null; // needs first-access setup
  if (s.password !== password) return null;
  const sess: Session = { role: "supplier", email: s.email, supplierId: s.id };
  setSession(sess);
  return sess;
}

export function setupSupplierPassword(email: string, password: string): Session | null {
  const s = findSupplierByEmail(email);
  if (!s) return null;
  if (s.password) return null;
  upsertSupplier({ ...s, password });
  const sess: Session = { role: "supplier", email: s.email, supplierId: s.id };
  setSession(sess);
  return sess;
}

export const ADMIN_CREDENTIALS = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
