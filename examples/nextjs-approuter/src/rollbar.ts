import Rollbar from 'rollbar';

const baseConfig = {
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: process.env.NODE_ENV,
};

export const clientConfig = {
  accessToken: process.env.NEXT_PUBLIC_POST_CLIENT_ITEM_TOKEN,
  ...baseConfig,
};

export const serverInstance = new Rollbar({
  accessToken: process.env.POST_SERVER_ITEM_TOKEN,
  ...baseConfig,
});
