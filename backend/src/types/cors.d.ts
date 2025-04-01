declare module "cors" {
  import { RequestHandler } from "express";
  interface CorsOptions {
    origin?:
      | string
      | string[]
      | ((
          origin: string | undefined,
          callback: (error: Error | null, allow?: boolean) => void
        ) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }
  function cors(options?: CorsOptions): RequestHandler;
  export = cors;
}
