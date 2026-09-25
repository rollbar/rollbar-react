import {
  Component,
  Context as ReactContext,
  ErrorInfo,
  ReactNode,
  ComponentType,
} from 'react';
import Rollbar from 'rollbar';

export const LEVEL_DEBUG = 'debug';
export const LEVEL_INFO = 'info';
export const LEVEL_WARN = 'warn';
export const LEVEL_ERROR = 'error';
export const LEVEL_CRITICAL = 'critical';
export type LEVEL =
  | typeof LEVEL_DEBUG
  | typeof LEVEL_INFO
  | typeof LEVEL_WARN
  | typeof LEVEL_ERROR
  | typeof LEVEL_CRITICAL;

type Extra = Record<string | number, unknown>;
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackUI?: ComponentType<{ error: Error | null; resetError: () => void }>;
  errorMessage?: string | (() => string);
  extra?: Extra | ((error: Error, errorInfo: ErrorInfo) => Extra);
  level?: LEVEL | (() => LEVEL);
  callback?: Rollbar.Callback;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  resetError: () => void;
}
export class RollbarContext extends Component<{
  children?: ReactNode;
  context: string;
  onRender?: boolean;
}> {}

export interface ProviderProps {
  Rollbar?: new (options: Rollbar.Configuration) => Rollbar;
  children: ReactNode;
  config?: Rollbar.Configuration | (() => Rollbar.Configuration);
  instance?: Rollbar;
}

interface ProviderState {
  rollbar: Rollbar;
  options: Rollbar.Configuration;
}

export class Provider extends Component<ProviderProps, ProviderState> {}

declare const RollbarInstance: unique symbol;
declare const BaseOptions: unique symbol;
declare const RollbarCtor: unique symbol;

interface ContextInterface {
  [RollbarInstance]: Rollbar;
  [BaseOptions]: Rollbar.Configuration;
  [RollbarCtor]: new (options: Rollbar.Configuration) => Rollbar;
}

export const Context: ReactContext<ContextInterface>;

export function getRollbarFromContext(
  context: ReactContext<ContextInterface>,
): Rollbar;
export function useRollbar(): Rollbar;
export function useRollbarConfiguration(config: Rollbar.Configuration): void;
export function useRollbarContext(ctx?: string, isLayout?: boolean): void;
export function useRollbarPerson(person: object): void;
export function useRollbarCaptureEvent(metadata: object, level?: LEVEL): void;
export function isValidLevel(level: LEVEL): boolean;

/**
 * The parts of a `history` location that `historyContext` passes on. Structural,
 * so locations from history v4 and v5 both fit without depending on `history`.
 */
export interface HistoryLocation {
  pathname: string;
  search: string;
  hash: string;
  state?: unknown;
  key?: string;
}

export interface HistoryContextOptions {
formatter?(location: HistoryLocation, action: string): string;
  filter?(location: HistoryLocation, action: string): boolean;
}

export interface HistoryContextListener {
  /** history v4: `history.listen((location, action) => ...)` */
  (location: HistoryLocation, action: string): void;
  /** history v5: `history.listen(({ location, action }) => ...)` */
  (update: { location: HistoryLocation; action: string }): void;
}

export function historyContext(
  rollbar: Rollbar,
  options?: HistoryContextOptions,
): HistoryContextListener;
