export function FallbackUI({ error }: { error: Error | null }) {
  const message = error?.message || 'unknown error';
  return <p>Oops, there was an error: {message}</p>;
}
