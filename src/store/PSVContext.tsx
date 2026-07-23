import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppData,
  Equipment,
  Location,
  PSV,
  PSVDatasheet,
  PSVEvent,
  PSVRepairRecord,
  PSVStatus,
} from '../types';
import { seedData } from '../data/mockData';
import { uid } from '../utils/id';
import { todayISO } from '../utils/dates';
import { STATUS_LABELS } from '../utils/compliance';
import {
  commercialBoilerLabel,
  COMMERCIAL_BOILER_DEFAULT_LABEL,
  normalizeAppData,
  normalizeCommercialBoilerPsv,
} from '../utils/psvDisplay';
import { isCloudApiMode, cloudLoadState, cloudSaveState, CLOUD_POLL_MS } from '../lib/cloudApi';
import { isCloudMode } from '../lib/cloudMode';
import { useAuth } from '../auth/AuthContext';

const STORAGE_KEY = 'psv-dashboard-data-v3';

export type SyncStatus = 'local' | 'loading' | 'saving' | 'saved' | 'error';

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed && Array.isArray(parsed.psvs) && Array.isArray(parsed.equipment)) {
        return normalizeAppData(parsed);
      }
    }
  } catch {
    // ignore and fall back to seed
  }
  return structuredClone(seedData);
}

interface PSVContextValue {
  data: AppData;
  /** Cloud sync state ('local' when running without cloud backend). */
  syncStatus: SyncStatus;

  // selectors
  getEquipment: (id: string) => Equipment | undefined;
  getLocation: (id: string) => Location | undefined;
  getPSV: (id: string) => PSV | undefined;
  locationsForEquipment: (equipmentId: string) => Location[];
  psvsForLocation: (locationId: string) => PSV[];
  psvsForEquipment: (equipmentId: string) => PSV[];

  // equipment CRUD
  addEquipment: (e: Omit<Equipment, 'id'>) => Equipment;
  updateEquipment: (id: string, patch: Partial<Omit<Equipment, 'id'>>) => void;
  deleteEquipment: (id: string) => void;

  // location CRUD
  addLocation: (l: Omit<Location, 'id'>) => Location;
  updateLocation: (id: string, patch: Partial<Omit<Location, 'id'>>) => void;
  deleteLocation: (id: string) => void;

  // PSV CRUD
  addPSV: (input: NewPSVInput) => PSV;
  updatePSV: (
    id: string,
    patch: Partial<
      Pick<PSV, 'serialNumber' | 'inventoryId' | 'tag' | 'locationId' | 'servicedOnSite' | 'useAndReplace'>
    >,
  ) => void;
  updateDatasheet: (id: string, datasheet: PSVDatasheet) => void;
  deletePSV: (id: string) => void;

  // status + history
  setStatus: (id: string, status: PSVStatus, date: string, note?: string) => void;
  addHistoryEvent: (id: string, event: NewEventInput) => void;
  updateHistoryEvent: (id: string, eventId: string, patch: Partial<PSVEvent>) => void;
  deleteHistoryEvent: (id: string, eventId: string) => void;

  /** Commercial boiler: log a new valve installed when the previous one was disposed. */
  recordReplacement: (id: string, input: NewReplacementInput) => void;

  // repair / overhaul history
  addRepairRecord: (id: string, record: NewRepairInput) => void;
  updateRepairRecord: (id: string, repairId: string, patch: Partial<NewRepairInput>) => void;
  deleteRepairRecord: (id: string, repairId: string) => void;

  // bulk
  replaceData: (data: AppData) => void;
}

export interface NewPSVInput {
  serialNumber?: string;
  inventoryId?: string;
  tag?: string;
  locationId: string;
  datasheet: PSVDatasheet;
  status: PSVStatus;
  servicedOnSite?: boolean;
  useAndReplace?: boolean;
  /** Effective date of the initial status (defaults to today). */
  statusDate?: string;
}

export interface NewReplacementInput {
  date: string;
  note?: string;
}

export interface NewEventInput {
  type: PSVEvent['type'];
  status?: PSVStatus;
  date: string;
  description?: string;
  note?: string;
}

export interface NewRepairInput {
  date: string;
  description: string;
  vendor?: string;
  workOrder?: string;
  note?: string;
}

const PSVContext = createContext<PSVContextValue | null>(null);

const EMPTY_DATA: AppData = { equipment: [], locations: [], psvs: [] };

/**
 * Enforces "only one installed PSV per location": when `keepId` is installed at
 * `locationId`, any other installed valve there is moved to Out for Service and
 * the change is logged. On-site serviced valves are left untouched.
 */
function enforceSingleInstalled(
  psvs: PSV[],
  locationId: string,
  keepId: string,
  now: string,
): PSV[] {
  return psvs.map((p) => {
    if (
      p.id !== keepId &&
      p.locationId === locationId &&
      p.status === 'installed' &&
      !p.servicedOnSite &&
      !p.useAndReplace
    ) {
      return {
        ...p,
        status: 'out_for_service' as PSVStatus,
        events: [
          ...p.events,
          {
            id: uid('evt'),
            psvId: p.id,
            type: 'status-change' as const,
            status: 'out_for_service' as PSVStatus,
            date: todayISO(),
            description: 'Removed — another valve was installed at this location',
            recordedAt: now,
          },
        ],
      };
    }
    return p;
  });
}

export function PSVProvider({ children }: { children: ReactNode }) {
  const { authed } = useAuth();
  const cloud = isCloudMode;
  const cloudApi = isCloudApiMode;

  const [data, setData] = useState<AppData>(() =>
    cloud ? structuredClone(EMPTY_DATA) : loadData(),
  );
  // In cloud mode, true once the initial shared state has been loaded.
  const [synced, setSynced] = useState(!cloud);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(cloud ? 'loading' : 'local');
  const applyingRemote = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncStatusRef = useRef<SyncStatus>(cloud ? 'loading' : 'local');
  const lastLocalEditAt = useRef(0);

  useEffect(() => {
    syncStatusRef.current = syncStatus;
  }, [syncStatus]);

  // --- Local mode: persist to localStorage ---------------------------------
  useEffect(() => {
    if (cloud) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage may be unavailable; non-fatal
    }
  }, [data, cloud]);

  // --- Cloud API mode: load + poll for updates --------------------------------
  useEffect(() => {
    if (!cloudApi || !authed) return;
    let active = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    setSyncStatus('loading');

    const loadFromServer = async (initial = false) => {
      if (!initial) {
        if (syncStatusRef.current === 'saving') return;
        // Don't clobber in-progress local edits when another poll tick arrives.
        if (Date.now() - lastLocalEditAt.current < 3000) return;
      }

      const { data: remote, error } = await cloudLoadState();
      if (!active) return;
      if (error && initial) {
        setSyncStatus('error');
        return;
      }
      if (remote) {
        applyingRemote.current = true;
        setData(normalizeAppData(remote));
      } else if (initial) {
        const seed = structuredClone(seedData);
        applyingRemote.current = true;
        setData(seed);
        await cloudSaveState(seed);
      }
      if (initial) {
        setSynced(true);
        setSyncStatus('saved');
      } else if (!error) {
        setSyncStatus('saved');
      }
    };

    void loadFromServer(true);
    pollTimer = setInterval(() => void loadFromServer(false), CLOUD_POLL_MS);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [cloudApi, authed]);

  // --- Cloud API mode: save local edits (debounced) ---------------------------
  useEffect(() => {
    if (!cloudApi || !authed || !synced) return;
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    lastLocalEditAt.current = Date.now();
    setSyncStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const snapshot = data;
    saveTimer.current = setTimeout(() => {
      cloudSaveState(snapshot).then(({ ok }) => setSyncStatus(ok ? 'saved' : 'error'));
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, cloudApi, authed, synced]);

  const getEquipment = useCallback(
    (id: string) => data.equipment.find((e) => e.id === id),
    [data.equipment],
  );
  const getLocation = useCallback(
    (id: string) => data.locations.find((l) => l.id === id),
    [data.locations],
  );
  const getPSV = useCallback((id: string) => data.psvs.find((p) => p.id === id), [data.psvs]);

  const locationsForEquipment = useCallback(
    (equipmentId: string) => data.locations.filter((l) => l.equipmentId === equipmentId),
    [data.locations],
  );
  const psvsForLocation = useCallback(
    (locationId: string) => data.psvs.filter((p) => p.locationId === locationId),
    [data.psvs],
  );
  const psvsForEquipment = useCallback(
    (equipmentId: string) => {
      const locIds = new Set(
        data.locations.filter((l) => l.equipmentId === equipmentId).map((l) => l.id),
      );
      return data.psvs.filter((p) => locIds.has(p.locationId));
    },
    [data.locations, data.psvs],
  );

  // --- Equipment -----------------------------------------------------------
  const addEquipment = useCallback((e: Omit<Equipment, 'id'>) => {
    const created: Equipment = { ...e, id: uid('eq') };
    setData((d) => ({ ...d, equipment: [...d.equipment, created] }));
    return created;
  }, []);

  const updateEquipment = useCallback(
    (id: string, patch: Partial<Omit<Equipment, 'id'>>) => {
      setData((d) => ({
        ...d,
        equipment: d.equipment.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    [],
  );

  const deleteEquipment = useCallback((id: string) => {
    setData((d) => {
      const locIds = new Set(d.locations.filter((l) => l.equipmentId === id).map((l) => l.id));
      return {
        equipment: d.equipment.filter((e) => e.id !== id),
        locations: d.locations.filter((l) => l.equipmentId !== id),
        psvs: d.psvs.filter((p) => !locIds.has(p.locationId)),
      };
    });
  }, []);

  // --- Location ------------------------------------------------------------
  const addLocation = useCallback((l: Omit<Location, 'id'>) => {
    const created: Location = { ...l, id: uid('loc') };
    setData((d) => ({ ...d, locations: [...d.locations, created] }));
    return created;
  }, []);

  const updateLocation = useCallback(
    (id: string, patch: Partial<Omit<Location, 'id'>>) => {
      setData((d) => ({
        ...d,
        locations: d.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      }));
    },
    [],
  );

  const deleteLocation = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      locations: d.locations.filter((l) => l.id !== id),
      psvs: d.psvs.filter((p) => p.locationId !== id),
    }));
  }, []);

  // --- PSV -----------------------------------------------------------------
  const addPSV = useCallback((input: NewPSVInput) => {
    const id = uid('psv');
    const now = new Date().toISOString();
    const date = input.statusDate ?? todayISO();
    const useAndReplace = Boolean(input.useAndReplace);
    const servicedOnSite = useAndReplace ? false : Boolean(input.servicedOnSite);
    const serialNumber = useAndReplace ? '' : (input.serialNumber?.trim() ?? '');
    const tag = useAndReplace
      ? input.tag?.trim() || COMMERCIAL_BOILER_DEFAULT_LABEL
      : input.tag;
    // On-site and use-and-replace valves are always treated as installed.
    const status: PSVStatus =
      servicedOnSite || useAndReplace ? 'installed' : input.status;
    const installDescription = useAndReplace
      ? 'Initial installation (use & replace)'
      : `Status set to ${STATUS_LABELS[status]}`;
    const createdDescription = useAndReplace
      ? `Commercial boiler valve added — ${commercialBoilerLabel({ tag: input.tag, useAndReplace: true })}`
      : `PSV ${serialNumber} added to the tracking system`;
    const events: PSVEvent[] = [
      {
        id: uid('evt'),
        psvId: id,
        type: 'created',
        date,
        description: createdDescription,
        recordedAt: now,
      },
      {
        id: uid('evt'),
        psvId: id,
        type: 'status-change',
        status,
        date,
        description: installDescription,
        recordedAt: now,
      },
    ];
    const created = normalizeCommercialBoilerPsv({
      id,
      serialNumber,
      inventoryId: useAndReplace ? undefined : input.inventoryId?.trim() || undefined,
      tag,
      locationId: input.locationId,
      status,
      servicedOnSite: servicedOnSite || undefined,
      useAndReplace: useAndReplace || undefined,
      datasheet: input.datasheet,
      events,
      repairHistory: [],
      createdAt: now,
    });
    setData((d) => {
      let psvs = [...d.psvs, created];
      if (status === 'installed' && !useAndReplace) {
        psvs = enforceSingleInstalled(psvs, created.locationId, id, now);
      }
      return { ...d, psvs };
    });
    return created;
  }, []);

  const updatePSV = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<PSV, 'serialNumber' | 'inventoryId' | 'tag' | 'locationId' | 'servicedOnSite' | 'useAndReplace'>
      >,
    ) => {
      setData((d) => ({
        ...d,
        psvs: d.psvs.map((p) => (p.id === id ? normalizeCommercialBoilerPsv({ ...p, ...patch }) : p)),
      }));
    },
    [],
  );

  const updateDatasheet = useCallback((id: string, datasheet: PSVDatasheet) => {
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      psvs: d.psvs.map((p) =>
        p.id === id
          ? {
              ...p,
              datasheet,
              events: [
                ...p.events,
                {
                  id: uid('evt'),
                  psvId: id,
                  type: 'datasheet-update',
                  date: todayISO(),
                  description: 'Datasheet information updated',
                  recordedAt: now,
                },
              ],
            }
          : p,
      ),
    }));
  }, []);

  const deletePSV = useCallback((id: string) => {
    setData((d) => ({ ...d, psvs: d.psvs.filter((p) => p.id !== id) }));
  }, []);

  // --- Status + history ----------------------------------------------------
  const setStatus = useCallback(
    (id: string, status: PSVStatus, date: string, note?: string) => {
      const now = new Date().toISOString();
      setData((d) => {
        const target = d.psvs.find((p) => p.id === id);
        if (!target || target.useAndReplace) return d;
        let psvs = d.psvs.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                events: [
                  ...p.events,
                  {
                    id: uid('evt'),
                    psvId: id,
                    type: 'status-change' as const,
                    status,
                    date,
                    description: `Status set to ${STATUS_LABELS[status]}`,
                    note,
                    recordedAt: now,
                  },
                ],
              }
            : p,
        );
        if (status === 'installed' && target) {
          psvs = enforceSingleInstalled(psvs, target.locationId, id, now);
        }
        return { ...d, psvs };
      });
    },
    [],
  );

  const addHistoryEvent = useCallback((id: string, event: NewEventInput) => {
    const now = new Date().toISOString();
    setData((d) => {
      let installedAtLoc: string | null = null;
      const psvs = d.psvs.map((p) => {
        if (p.id !== id) return p;
        const defaultDescription =
          event.type === 'service'
            ? 'Serviced on site'
            : event.status
              ? `Status set to ${STATUS_LABELS[event.status]}`
              : 'History entry';
        const newEvent: PSVEvent = {
          id: uid('evt'),
          psvId: id,
          type: event.type,
          status: event.status,
          date: event.date,
          description: event.description ?? defaultDescription,
          note: event.note,
          recordedAt: now,
        };
        // If this status-change is the latest by date, reflect it as current status.
        let status = p.status;
        if (event.type === 'status-change' && event.status) {
          const latestDate = p.events
            .filter((e) => e.type === 'status-change')
            .map((e) => e.date)
            .sort()
            .pop();
          if (!latestDate || event.date >= latestDate) status = event.status;
        }
        if (status === 'installed') installedAtLoc = p.locationId;
        return { ...p, status, events: [...p.events, newEvent] };
      });
      return {
        ...d,
        psvs: installedAtLoc ? enforceSingleInstalled(psvs, installedAtLoc, id, now) : psvs,
      };
    });
  }, []);

  const recomputeStatus = (events: PSVEvent[], fallback: PSVStatus): PSVStatus => {
    const statusEvents = events
      .filter((e) => e.type === 'status-change' && e.status)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return statusEvents.length ? statusEvents[statusEvents.length - 1].status! : fallback;
  };

  const updateHistoryEvent = useCallback(
    (id: string, eventId: string, patch: Partial<PSVEvent>) => {
      setData((d) => ({
        ...d,
        psvs: d.psvs.map((p) => {
          if (p.id !== id) return p;
          const events = p.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e));
          return { ...p, events, status: recomputeStatus(events, p.status) };
        }),
      }));
    },
    [],
  );

  const deleteHistoryEvent = useCallback((id: string, eventId: string) => {
    setData((d) => ({
      ...d,
      psvs: d.psvs.map((p) => {
        if (p.id !== id) return p;
        const events = p.events.filter((e) => e.id !== eventId);
        return { ...p, events, status: recomputeStatus(events, p.status) };
      }),
    }));
  }, []);

  const recordReplacement = useCallback((id: string, input: NewReplacementInput) => {
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      psvs: d.psvs.map((p) => {
        if (p.id !== id || !p.useAndReplace) return p;
        const newEvent: PSVEvent = {
          id: uid('evt'),
          psvId: id,
          type: 'replacement',
          date: input.date,
          description: 'Valve replaced — new unit installed',
          note: input.note,
          recordedAt: now,
        };
        return {
          ...p,
          status: 'installed' as PSVStatus,
          events: [...p.events, newEvent],
        };
      }),
    }));
  }, []);

  const addRepairRecord = useCallback((id: string, record: NewRepairInput) => {
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      psvs: d.psvs.map((p) => {
        if (p.id !== id) return p;
        const entry: PSVRepairRecord = {
          id: uid('rpr'),
          psvId: id,
          date: record.date,
          description: record.description,
          vendor: record.vendor,
          workOrder: record.workOrder,
          note: record.note,
          recordedAt: now,
        };
        return { ...p, repairHistory: [...(p.repairHistory ?? []), entry] };
      }),
    }));
  }, []);

  const updateRepairRecord = useCallback(
    (id: string, repairId: string, patch: Partial<NewRepairInput>) => {
      setData((d) => ({
        ...d,
        psvs: d.psvs.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            repairHistory: (p.repairHistory ?? []).map((r) =>
              r.id === repairId ? { ...r, ...patch } : r,
            ),
          };
        }),
      }));
    },
    [],
  );

  const deleteRepairRecord = useCallback((id: string, repairId: string) => {
    setData((d) => ({
      ...d,
      psvs: d.psvs.map((p) =>
        p.id === id
          ? { ...p, repairHistory: (p.repairHistory ?? []).filter((r) => r.id !== repairId) }
          : p,
      ),
    }));
  }, []);

  const replaceData = useCallback((d: AppData) => setData(normalizeAppData(structuredClone(d))), []);

  const value = useMemo<PSVContextValue>(
    () => ({
      data,
      syncStatus,
      getEquipment,
      getLocation,
      getPSV,
      locationsForEquipment,
      psvsForLocation,
      psvsForEquipment,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      addLocation,
      updateLocation,
      deleteLocation,
      addPSV,
      updatePSV,
      updateDatasheet,
      deletePSV,
      setStatus,
      addHistoryEvent,
      updateHistoryEvent,
      deleteHistoryEvent,
      recordReplacement,
      addRepairRecord,
      updateRepairRecord,
      deleteRepairRecord,
      replaceData,
    }),
    [
      data,
      syncStatus,
      getEquipment,
      getLocation,
      getPSV,
      locationsForEquipment,
      psvsForLocation,
      psvsForEquipment,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      addLocation,
      updateLocation,
      deleteLocation,
      addPSV,
      updatePSV,
      updateDatasheet,
      deletePSV,
      setStatus,
      addHistoryEvent,
      updateHistoryEvent,
      deleteHistoryEvent,
      recordReplacement,
      addRepairRecord,
      updateRepairRecord,
      deleteRepairRecord,
      replaceData,
    ],
  );

  return <PSVContext.Provider value={value}>{children}</PSVContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePSV(): PSVContextValue {
  const ctx = useContext(PSVContext);
  if (!ctx) throw new Error('usePSV must be used within a PSVProvider');
  return ctx;
}
