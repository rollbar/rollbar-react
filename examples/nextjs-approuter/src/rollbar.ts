import Rollbar from 'rollbar';

export const rollbarInstance = new Rollbar({
  accessToken:
    typeof window === 'undefined'
      ? process.env.POST_SERVER_ITEM_TOKEN
      : process.env.NEXT_PUBLIC_POST_CLIENT_ITEM_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: process.env.NODE_ENV,
});
