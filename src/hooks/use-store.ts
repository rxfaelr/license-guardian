import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ensureSeed,
  getLicenses,
  getLicenseTypes,
  getSession,
  getSuppliers,
} from "@/lib/storage";

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("verdor:storage", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("verdor:storage", handler);
    window.removeEventListener("storage", handler);
  };
}

export function useSeed() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    ensureSeed();
    setReady(true);
  }, []);
  return ready;
}

export function useSuppliers() {
  return useSyncExternalStore(subscribe, getSuppliers, () => []);
}
export function useLicenseTypes() {
  return useSyncExternalStore(subscribe, getLicenseTypes, () => []);
}
export function useLicenses() {
  return useSyncExternalStore(subscribe, getLicenses, () => []);
}
export function useSession() {
  return useSyncExternalStore(subscribe, getSession, () => null);
}
