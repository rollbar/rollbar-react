import { Component, ReactNode } from "react";
import Rollbar from "rollbar";

export const LEVEL_DEBUG = "debug";
export const LEVEL_INFO = "info";
export const LEVEL_WARN = "warn";
export const LEVEL_ERROR = "error";
export const LEVEL_CRITICAL = "critical";
export type LEVEL =
  | typeof LEVEL_DEBUG
  | typeof LEVEL_INFO
  | typeof LEVEL_WARN
  | typeof LEVEL_ERROR
  | typeof LEVEL_CRITICAL;

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackUI?: ReactNode
  errorMessage?: string | (() => string)
  extra?: Record<string | number, unknown> | (() => Record<string | number, unknown>)
  level?: LEVEL | (() => LEVEL)
  callback?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | undefined
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {}
export class RollbarContext extends Component<{
  children: ReactNode;
  context?: string;
}> {}
export function useRollbar(): Rollbar;
export function useRollbarConfiguration(config: Rollbar.Configuration): Rollbar;
export function useRollbarContext(ctx?: string, isLayout?: boolean): void;
export function useRollbarPerson(person: any): void;
export function useRollbarCaptureEvent(metadata: object, level?: LEVEL): void;
export function isValidLevel(): boolean;

export function historyContext(
  rollbar: Rollbar,
  args: {
    formatter: (location: string, action: string) => void;
    filter: (location: string, action: string) => void;
  }
): (v4Location: { action: string; filter: string }, v4action: string) => void;
