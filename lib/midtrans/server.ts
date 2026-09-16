// The midtrans-client package ships no types; declare the minimal surface we use.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import midtransClient from "midtrans-client";

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
const serverKey = process.env.MIDTRANS_SERVER_KEY as string;
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string;

/**
 * Snap client — used server-side to create a transaction and get a Snap token.
 * Requires the SECRET server key, so this must never run in the browser.
 */
export function getSnapClient() {
  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  });
}

/**
 * CoreApi client — used to read/verify notifications from the webhook.
 */
export function getCoreApiClient() {
  return new midtransClient.CoreApi({
    isProduction,
    serverKey,
    clientKey,
  });
}

export { isProduction };
