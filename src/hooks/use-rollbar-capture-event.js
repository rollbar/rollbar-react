import invariant from 'tiny-invariant';
import VALID_LEVELS, { LEVEL_DEBUG, LEVEL_INFO, LEVEL_CRITICAL } from '../constants';
import { useRollbar } from './use-rollbar';

export function useRollbarCaptureEvent(metadata, level = LEVEL_INFO) {
  invariant(VALID_LEVELS[level] <= LEVEL_CRITICAL && VALID_LEVELS[level] >= LEVEL_DEBUG, '')
  const rollbar = useRollbar();
  useEffect(() => {
    rollbar.captureEvent(metadata, level);
  }, [metadata]);
}

