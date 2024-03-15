'use client';

export default function NextErrorHandlerGenerator() {
  return (
    <button
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={() => {
        throw new Error('Something handled by NextJS');
      }}
    >
      Click for Error with Next.js Error Handler
    </button>
  );
}
