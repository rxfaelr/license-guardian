import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ensureSeed,
  getLicenses,
  getLicenseTypes,
  getSession,
  getSuppliers,
} from "@/lib/storage";
import type { LicenseDocument, LicenseType, Session, Supplier } from "@/lib/types";

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("verdor:storage", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("verdor:storage", handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Cached snapshot factory — useSyncExternalStore requires getSnapshot to return
 * a referentially stable value when the underlying data hasn't changed,
 * otherwise React enters an infinite re-render loop.
 */
function makeCachedSnapshot<T>(read: () => T) {
  let cache: T | undefined;
  let cacheJson: string | undefined;
  return () => {
    const next = read();
    const nextJson = JSON.stringify(next);
    if (nextJson !== cacheJson) {
      cache = next;
      cacheJson = nextJson;
    }
    return cache as T;
  };
}

const getSuppliersCached = makeCachedSnapshot<Supplier[]>(getSuppliers);
const getLicenseTypesCached = makeCachedSnapshot<LicenseType[]>(getLicenseTypes);
const getLicensesCached = makeCachedSnapshot<LicenseDocument[]>(getLicenses);
const getSessionCached = makeCachedSnapshot<Session | null>(() => getSession());

const EMPTY_SUPPLIERS: Supplier[] = [];
const EMPTY_TYPES: LicenseType[] = [];
const EMPTY_LICENSES: LicenseDocument[] = [];

export function useSeed() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    ensureSeed();
    setReady(true);
  }, []);
  return ready;
}

/** True only after first client mount — use to guard localStorage-derived UI from SSR. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function useSuppliers() {
  return useSyncExternalStore(subscribe, getSuppliersCached, () => EMPTY_SUPPLIERS);
}
export function useLicenseTypes() {
  return useSyncExternalStore(subscribe, getLicenseTypesCached, () => EMPTY_TYPES);
}
export function useLicenses() {
  return useSyncExternalStore(subscribe, getLicensesCached, () => EMPTY_LICENSES);
}
export function useSession() {
  return useSyncExternalStore(subscribe, getSessionCached, () => null);
}
