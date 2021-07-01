import { Option, none, some } from "fp-ts/lib/Option";

import { HttpContext } from "../aspnetcore/http";
import { skipPipeline } from "./core";
import { HttpFunc, HttpHandler } from ".";

namespace SubRouting {
  const RouteKey = "niraffe_route";

  const getSavedPartialPath = (ctx: HttpContext): Option<string> => {
    if ([...ctx.Items.keys()].includes(RouteKey)) {
      const path = ctx.Items.get(RouteKey);
      return path ? some(path) : none;
    }
    return none;
  };

  // TODO: Continue here!
}

export const route =
  (path: string): HttpHandler =>
  (next: HttpFunc) =>
  (ctx: HttpContext) => {
    if (SubRouting.getNextPartOfPath(ctx) === path) {
      return next(ctx);
    } else {
      return skipPipeline;
    }
  };
