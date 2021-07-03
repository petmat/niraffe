import express, { NextFunction, Request, Response } from "express";

import { HttpContext } from "./aspnetcore/http";
import {
  ILoggerFactory,
  LogLevel,
  LoggerFactory,
} from "./microsoft.extensions/logging";
import {
  HttpFunc,
  HttpHandler,
  choose,
  compose,
  earlyReturn,
  route,
  text,
} from "./niraffe";

const webApp = choose([
  compose(route("/"))(text("Hello world, from Niraffe!")),
]);

const niraffe =
  (handler: HttpHandler, loggerFactory: ILoggerFactory) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (next == null) {
      throw new Error('Argument "next" was null.');
    }

    const logger = loggerFactory.CreateLogger();

    // pre-compile the handler pipeline
    const func: HttpFunc = handler(earlyReturn);

    const start = new Date().getTime();

    const ctx = new HttpContext(req, res);
    func(ctx).then((result) => {
      if (logger.IsEnabled(LogLevel.Debug)) {
        const stop = new Date().getTime();
        const elapsedMs = stop - start;

        logger.LogDebug(
          `Niraffe returned ${result._tag === "Some" ? "Some" : "None"} for ${
            ctx.Request.Protocol
          } ${ctx.Request.Method} at ${ctx.Request.Path} in ${elapsedMs}`
        );
      }

      if (result._tag === "None") {
        return next();
      }
    });
  };

const main = (args: string[]) => {
  const app = express();

  app.use(niraffe(webApp, new LoggerFactory()));

  app.listen(3000, () => {
    console.log("Express with TypeScript, http://localhost:3000");
  });
};

main(process.argv);
