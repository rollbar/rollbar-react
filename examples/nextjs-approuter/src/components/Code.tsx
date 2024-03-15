'use client';

import { CodeBlock } from 'react-code-blocks';

export function Code({ code }: { code: string }) {
  return <CodeBlock text={code} language="javascript" showLineNumbers={true} />;
}
