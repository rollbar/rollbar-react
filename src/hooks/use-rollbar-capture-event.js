import invariant from 'tiny-invariant';
import { LEVEL_INFO } from '../constants';
import { useRollbar } from './use-rollbar';
import { isValidLevel } from '../utils';

export function useRollbarCaptureEvent(metadata, level = LEVEL_INFO) {
  invariant(isValidLevel(level), `${level} is not a valid level setting for Rollbar`);
  const rollbar = useRollbar();
  useEffect(() => {
    rollbar.captureEvent(metadata, level);
  }, [metadata, level, rollbar]);
}

