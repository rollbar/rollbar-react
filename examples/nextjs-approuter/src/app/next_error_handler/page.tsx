'use client';

export default function NextErrorHandlerGenerator() {
  return (
    <button
      onClick={() => {
        throw new Error('Something handled by NextJS');
      }}
    >
      Click for Error with Next.js Error Handler
    </button>
  );
}
