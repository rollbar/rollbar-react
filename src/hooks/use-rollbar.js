import { useContext } from 'react';
import { Context, getRollbarFromContext } from '../provider';

export function useRollbar() {
  const context = useContext(Context);
  return getRollbarFromContext(context);
}
