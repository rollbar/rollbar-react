import React, { ReactElement } from 'react';

export interface FallbackProps {
  error?: Error;
}

export const FallbackUI = ({ error }: FallbackProps): ReactElement => {
  const message = error?.message || 'unknown error';
  return <div>Oops, there was an error: {message}</div>;
};
