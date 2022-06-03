import { Component, Context as ReactContext, ErrorInfo, ReactNode } from 'react';
import Rollbar, { Callback, Configuration } from 'rollbar';

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
  fallbackUI?: ReactNode;
  errorMessage?: string | (() => string);
  extra?:
    | Extra
    | ((error: Error, errorInfo: ErrorInfo) => Extra);
  level?: LEVEL | (() => LEVEL);
  callback?: Callback<any>;
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
  children: ReactNode;
  context?: string;
}> {}

export interface ProviderProps {
  Rollbar?: new (options: Configuration) => Rollbar;
  children: ReactNode;
  config?: Configuration | (() => Configuration);
  instance?: Rollbar;
}

interface ProviderState {
  rollbar: Rollbar;
  options: Configuration;
}

export class Provider extends Component<ProviderProps, ProviderState> {}

declare const RollbarInstance: unique symbol;
declare const BaseOptions: unique symbol;
declare const RollbarCtor: unique symbol;

interface ContextInterface {
  [RollbarInstance]: Rollbar;
  [BaseOptions]: Configuration;
  [RollbarCtor]: new (options: Configuration) => Rollbar;
}

export const Context: ReactContext<ContextInterface>;

export function getRollbarFromContext(context: ReactContext<ContextInterface>): Rollbar;
export function useRollbar(): Rollbar;
export function useRollbarConfiguration(config: Rollbar.Configuration): void;
export function useRollbarContext(ctx?: string, isLayout?: boolean): void;
export function useRollbarPerson(person: object): void;
export function useRollbarCaptureEvent(metadata: object, level?: LEVEL): void;
export function isValidLevel(level: LEVEL): boolean;

export function historyContext(
  rollbar: Rollbar,
  args: {
    formatter: (location: string, action: string) => string;
    filter: (location: string, action: string) => boolean;
  }
): (
  v4Location: {
    action: string;
    filter: (location: string, action: string) => boolean;
  },
  v4action: string
) => void;
