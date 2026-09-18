import { Provider as RollbarProvider } from '@rollbar/react';

import RootLayout from '@/app/layout';
import { clientConfig } from '@/rollbar';

describe('app router root layout', () => {
  it('wraps the document in the Rollbar provider', async () => {
    const element = await RootLayout({ children: <p>child</p> });

    expect(element.type).toBe(RollbarProvider);
    expect(element.props.config).toBe(clientConfig);

    const html = element.props.children;
    expect(html.type).toBe('html');
    expect(html.props.children.type).toBe('body');
  });
});
