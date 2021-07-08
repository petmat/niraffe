import { NextFunction, Request, Response } from "express";

import { HttpContext } from "../aspnetcore/http";
import { HttpFunc, HttpHandler, earlyReturn } from ".";

export const niraffe =
  (handler: HttpHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (next == null) {
      throw new Error('Argument "next" was null.');
    }

    // pre-compile the handler pipeline
    const func: HttpFunc = handler(earlyReturn);

    const start = new Date().getTime();

    const ctx = new HttpContext(req, res);
    func(ctx).then((result) => {
      if (result._tag === "None") {
        return next();
      }
    });
  };
