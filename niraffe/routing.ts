import { pipe } from "fp-ts/lib/function";
import { Option, none, some } from "fp-ts/lib/Option";

import { HttpContext } from "../aspnetcore/http";
import { skipPipeline } from "./core";
import {
  ExtractFields,
  HttpFunc,
  HttpHandler,
  MatchOptions,
  tryMatchInput,
} from ".";

namespace SubRouting {
  const RouteKey = "niraffe_route";

  export const getSavedPartialPath = (ctx: HttpContext): Option<string> => {
    if ([...ctx.Items.keys()].includes(RouteKey)) {
      const path = ctx.Items.get(RouteKey);
      return path ? some(path) : none;
    }
    return none;
  };

  export const getNextPartOfPath = (ctx: HttpContext) => {
    const p = getSavedPartialPath(ctx);
    if (p._tag === "Some" && ctx.Request.Path.includes(p.value)) {
      return ctx.Request.Path.slice(p.value.length);
    }
    return ctx.Request.Path;
  };
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

export const routef =
  <TPath extends string>(path: TPath) =>
  (routeHandler: (t: ExtractFields<TPath>) => HttpHandler): HttpHandler => {
    return (next: HttpFunc) => (ctx: HttpContext) => {
      const temp = tryMatchInput(path)(MatchOptions.Exact)(
        SubRouting.getNextPartOfPath(ctx)
      );
      return pipe(temp, (args) => {
        switch (args._tag) {
          case "Some":
            const temp = routeHandler(args.value)(next)(ctx);
            return temp.then((v) => v);
          case "None":
            return skipPipeline;
        }
      });
    };
  };
