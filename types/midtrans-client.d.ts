/**
 * Minimal type declarations for the `midtrans-client` package (it ships none).
 * Covers only the surface this app uses.
 */
declare module "midtrans-client" {
  interface Config {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionResult {
    token: string;
    redirect_url: string;
  }

  export class Snap {
    constructor(config: Config);
    createTransaction(params: Record<string, unknown>): Promise<TransactionResult>;
    createTransactionToken(params: Record<string, unknown>): Promise<string>;
  }

  export class CoreApi {
    constructor(config: Config);
    transaction: {
      notification(payload: unknown): Promise<Record<string, unknown>>;
      status(orderId: string): Promise<Record<string, unknown>>;
    };
  }

  const _default: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default _default;
}
