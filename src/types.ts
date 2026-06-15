export const WORKFLOW_STEPS = [
  { key: "inspection", label: "Inspection" },
  { key: "cleaning", label: "Cleaning" },
  { key: "testing", label: "Testing" },
  { key: "certification", label: "Certification" },
  { key: "completion", label: "Completion" },
] as const;

export type WorkflowStepKey = (typeof WORKFLOW_STEPS)[number]["key"];

export interface WorkflowStep {
  key: WorkflowStepKey;
  label: string;
  completed: boolean;
  /** ISO timestamp captured when the step is marked complete. */
  completedAt: string | null;
  notes: string;
}

export interface RepairLog {
  id: string;
  /** ISO timestamp the repair was logged. */
  loggedAt: string;
  description: string;
}

export type InspectionResult = "pass" | "fail";
export type InspectionStatus = "in-progress" | "completed";

export interface Inspection {
  id: string;
  /** Calendar date of the inspection (yyyy-mm-dd). */
  date: string;
  /** ISO timestamp the inspection round started. */
  startedAt: string;
  /** ISO timestamp the inspection round was completed (all steps done). */
  completedAt: string | null;
  notes: string;
  result: InspectionResult;
  steps: WorkflowStep[];
  repairs: RepairLog[];
  status: InspectionStatus;
}

export interface Boiler {
  id: string;
  name: string;
  type: string;
  capacity: string;
  pressureRating: string;
  manufacturer: string;
  installDate: string;
  location: string;
  /** How often (in days) this boiler must be inspected. */
  inspectionIntervalDays: number;
  activeInspection: Inspection | null;
  history: Inspection[];
}

/**
 * Visual status derived from a boiler's inspection state.
 * - failed:  red   — failed its last inspection, needs repairs
 * - active:  amber — an inspection is underway
 * - passed:  green — passed and everything is complete
 * - none:    gray  — no inspection has been started yet
 */
export type BoilerStatus = "failed" | "active" | "passed" | "none";
