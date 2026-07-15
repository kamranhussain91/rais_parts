import express, { type Express } from "express";
import cors from "cors";
import * as pinoHttpModule from "pino-http";
import type { IncomingMessage, ServerResponse } from "http";
import router from "./routes";
import { logger } from "./lib/logger";

const pinoHttpResolved =
  (pinoHttpModule as unknown as { default?: unknown }).default ?? pinoHttpModule;
const pinoHttp = pinoHttpResolved as unknown as (opts?: Record<string, unknown>) => express.RequestHandler;

const app: Express = express();
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: IncomingMessage & { id?: string }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);
export default app;
