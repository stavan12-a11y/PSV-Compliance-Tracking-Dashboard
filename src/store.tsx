import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Boiler, Inspection, InspectionResult } from "./types";
import { WORKFLOW_STEPS } from "./types";
import { createDemoBoilers } from "./lib/demo";
import { loadBoilers, saveBoilers } from "./lib/storage";
import { freshWorkflowSteps, nowIso, uid } from "./lib/helpers";

export interface NewBoilerInput {
  name: string;
  type: string;
  capacity: string;
  pressureRating: string;
  manufacturer: string;
  installDate: string;
  location: string;
  inspectionIntervalDays: number;
}

export interface StartInspectionInput {
  date: string;
  notes: string;
  result: InspectionResult;
}

interface FleetContextValue {
  boilers: Boiler[];
  addBoiler: (input: NewBoilerInput) => void;
  updateBoilerField: <K extends keyof Boiler>(
    boilerId: string,
    field: K,
    value: Boiler[K]
  ) => void;
  removeBoiler: (boilerId: string) => void;
  startInspection: (boilerId: string, input: StartInspectionInput) => void;
  setStepNotes: (boilerId: string, stepKey: string, notes: string) => void;
  completeStep: (boilerId: string, stepKey: string, notes: string) => void;
  addRepairLog: (boilerId: string, description: string) => void;
  triggerReInspection: (boilerId: string) => void;
  resetToDemo: () => void;
}

const FleetContext = createContext<FleetContextValue | null>(null);

function mapBoiler(
  boilers: Boiler[],
  boilerId: string,
  updater: (boiler: Boiler) => Boiler
): Boiler[] {
  return boilers.map((b) => (b.id === boilerId ? updater(b) : b));
}

function mapActiveInspection(
  boiler: Boiler,
  updater: (insp: Inspection) => Inspection
): Boiler {
  if (!boiler.activeInspection) return boiler;
  return { ...boiler, activeInspection: updater(boiler.activeInspection) };
}

export function FleetProvider({ children }: { children: ReactNode }) {
  const [boilers, setBoilers] = useState<Boiler[]>(() => loadBoilers());
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      // Persist initial (possibly demo) state so refreshes are stable.
      saveBoilers(boilers);
      return;
    }
    saveBoilers(boilers);
  }, [boilers]);

  const addBoiler = useCallback((input: NewBoilerInput) => {
    setBoilers((prev) => [
      ...prev,
      {
        id: uid("blr"),
        name: input.name,
        type: input.type,
        capacity: input.capacity,
        pressureRating: input.pressureRating,
        manufacturer: input.manufacturer,
        installDate: input.installDate,
        location: input.location,
        inspectionIntervalDays: input.inspectionIntervalDays,
        activeInspection: null,
        history: [],
      },
    ]);
  }, []);

  const updateBoilerField = useCallback(
    <K extends keyof Boiler>(boilerId: string, field: K, value: Boiler[K]) => {
      setBoilers((prev) =>
        mapBoiler(prev, boilerId, (b) => ({ ...b, [field]: value }))
      );
    },
    []
  );

  const removeBoiler = useCallback((boilerId: string) => {
    setBoilers((prev) => prev.filter((b) => b.id !== boilerId));
  }, []);

  const startInspection = useCallback(
    (boilerId: string, input: StartInspectionInput) => {
      setBoilers((prev) =>
        mapBoiler(prev, boilerId, (b) => {
          const inspection: Inspection = {
            id: uid("insp"),
            date: input.date,
            startedAt: nowIso(),
            completedAt: null,
            notes: input.notes,
            result: input.result,
            steps: input.result === "pass" ? freshWorkflowSteps() : [],
            repairs: [],
            status: "in-progress",
          };
          return { ...b, activeInspection: inspection };
        })
      );
    },
    []
  );

  const setStepNotes = useCallback(
    (boilerId: string, stepKey: string, notes: string) => {
      setBoilers((prev) =>
        mapBoiler(prev, boilerId, (b) =>
          mapActiveInspection(b, (insp) => ({
            ...insp,
            steps: insp.steps.map((s) =>
              s.key === stepKey ? { ...s, notes } : s
            ),
          }))
        )
      );
    },
    []
  );

  const completeStep = useCallback(
    (boilerId: string, stepKey: string, notes: string) => {
      setBoilers((prev) =>
        mapBoiler(prev, boilerId, (b) => {
          if (!b.activeInspection) return b;
          const insp = b.activeInspection;
          const steps = insp.steps.map((s) =>
            s.key === stepKey
              ? { ...s, completed: true, completedAt: nowIso(), notes }
              : s
          );
          const allDone = steps.every((s) => s.completed);
          if (allDone) {
            // Final step done: mark complete and archive straight to history.
            const completed: Inspection = {
              ...insp,
              steps,
              status: "completed",
              completedAt: nowIso(),
            };
            return {
              ...b,
              activeInspection: null,
              history: [completed, ...b.history],
            };
          }
          return { ...b, activeInspection: { ...insp, steps } };
        })
      );
    },
    []
  );

  const addRepairLog = useCallback((boilerId: string, description: string) => {
    setBoilers((prev) =>
      mapBoiler(prev, boilerId, (b) =>
        mapActiveInspection(b, (insp) => ({
          ...insp,
          repairs: [
            ...insp.repairs,
            { id: uid("rep"), loggedAt: nowIso(), description },
          ],
        }))
      )
    );
  }, []);

  const triggerReInspection = useCallback((boilerId: string) => {
    setBoilers((prev) =>
      mapBoiler(prev, boilerId, (b) => {
        if (!b.activeInspection) return b;
        // Archive the failed (now repaired) inspection and clear active so a
        // fresh inspection can be started.
        const archived: Inspection = {
          ...b.activeInspection,
          status: "completed",
          completedAt: b.activeInspection.completedAt ?? nowIso(),
        };
        return {
          ...b,
          history: [archived, ...b.history],
          activeInspection: null,
        };
      })
    );
  }, []);

  const resetToDemo = useCallback(() => {
    setBoilers(createDemoBoilers());
  }, []);

  const value = useMemo<FleetContextValue>(
    () => ({
      boilers,
      addBoiler,
      updateBoilerField,
      removeBoiler,
      startInspection,
      setStepNotes,
      completeStep,
      addRepairLog,
      triggerReInspection,
      resetToDemo,
    }),
    [
      boilers,
      addBoiler,
      updateBoilerField,
      removeBoiler,
      startInspection,
      setStepNotes,
      completeStep,
      addRepairLog,
      triggerReInspection,
      resetToDemo,
    ]
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet(): FleetContextValue {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used within a FleetProvider");
  return ctx;
}

export { WORKFLOW_STEPS };
