import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  PSVStatus,
} from '../types';
import { seedData } from '../data/mockData';
import { uid } from '../utils/id';
import { todayISO } from '../utils/dates';
import { STATUS_LABELS } from '../utils/compliance';

const STORAGE_KEY = 'psv-dashboard-data-v2';

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed && Array.isArray(parsed.psvs) && Array.isArray(parsed.equipment)) {
        return parsed;
      }
    }
  } catch {
    // ignore and fall back to seed
  }
  return structuredClone(seedData);
}

interface PSVContextValue {
  data: AppData;

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
  updatePSV: (id: string, patch: Partial<Pick<PSV, 'serialNumber' | 'tag' | 'locationId'>>) => void;
  updateDatasheet: (id: string, datasheet: PSVDatasheet) => void;
  deletePSV: (id: string) => void;

  // status + history
  setStatus: (id: string, status: PSVStatus, date: string, note?: string) => void;
  addHistoryEvent: (id: string, event: NewEventInput) => void;
  updateHistoryEvent: (id: string, eventId: string, patch: Partial<PSVEvent>) => void;
  deleteHistoryEvent: (id: string, eventId: string) => void;

  // bulk
  resetToSeed: () => void;
  replaceData: (data: AppData) => void;
}

export interface NewPSVInput {
  serialNumber: string;
  tag?: string;
  locationId: string;
  datasheet: PSVDatasheet;
  status: PSVStatus;
  /** Effective date of the initial status (defaults to today). */
  statusDate?: string;
}

export interface NewEventInput {
  type: PSVEvent['type'];
  status?: PSVStatus;
  date: string;
  description?: string;
  note?: string;
}

const PSVContext = createContext<PSVContextValue | null>(null);

export function PSVProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage may be unavailable; non-fatal
    }
  }, [data]);

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
    const events: PSVEvent[] = [
      {
        id: uid('evt'),
        psvId: id,
        type: 'created',
        date,
        description: `PSV ${input.serialNumber} added to the tracking system`,
        recordedAt: now,
      },
      {
        id: uid('evt'),
        psvId: id,
        type: 'status-change',
        status: input.status,
        date,
        description: `Status set to ${STATUS_LABELS[input.status]}`,
        recordedAt: now,
      },
    ];
    const created: PSV = {
      id,
      serialNumber: input.serialNumber,
      tag: input.tag,
      locationId: input.locationId,
      status: input.status,
      datasheet: input.datasheet,
      events,
      createdAt: now,
    };
    setData((d) => ({ ...d, psvs: [...d.psvs, created] }));
    return created;
  }, []);

  const updatePSV = useCallback(
    (id: string, patch: Partial<Pick<PSV, 'serialNumber' | 'tag' | 'locationId'>>) => {
      setData((d) => ({
        ...d,
        psvs: d.psvs.map((p) => (p.id === id ? { ...p, ...patch } : p)),
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
      setData((d) => ({
        ...d,
        psvs: d.psvs.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                events: [
                  ...p.events,
                  {
                    id: uid('evt'),
                    psvId: id,
                    type: 'status-change',
                    status,
                    date,
                    description: `Status set to ${STATUS_LABELS[status]}`,
                    note,
                    recordedAt: now,
                  },
                ],
              }
            : p,
        ),
      }));
    },
    [],
  );

  const addHistoryEvent = useCallback((id: string, event: NewEventInput) => {
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      psvs: d.psvs.map((p) => {
        if (p.id !== id) return p;
        const newEvent: PSVEvent = {
          id: uid('evt'),
          psvId: id,
          type: event.type,
          status: event.status,
          date: event.date,
          description:
            event.description ??
            (event.status ? `Status set to ${STATUS_LABELS[event.status]}` : 'History entry'),
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
        return { ...p, status, events: [...p.events, newEvent] };
      }),
    }));
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

  const resetToSeed = useCallback(() => setData(structuredClone(seedData)), []);
  const replaceData = useCallback((d: AppData) => setData(structuredClone(d)), []);

  const value = useMemo<PSVContextValue>(
    () => ({
      data,
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
      resetToSeed,
      replaceData,
    }),
    [
      data,
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
      resetToSeed,
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
