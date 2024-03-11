export default function NextErrorHandlerGenerator() {
  return (
    <button
      onClick={() => {
        throw new Error('Something broke');
      }}
    >
      Click for Error with Next.js Error Handler
    </button>
  );
}
