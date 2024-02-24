import { useRollbarConfiguration } from './use-rollbar-config';

export function useRollbarPerson(person) {
  useRollbarConfiguration({ payload: { person } });
}
