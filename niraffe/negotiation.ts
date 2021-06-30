import { head } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/pipeable";
import { HttpContext } from "../aspnetcore/http";
import { earlyReturn, HttpFunc, HttpFuncResult, HttpHandler } from "./core";

// ---------------------------
// Configuration types
// ---------------------------

/**
 * Interface defining the negotiation rules and the `HttpHandler` for unacceptable requests when doing content negotiation in Niraffe.
 */
interface INegotiationConfig {
  /**
   * A dictionary of mime types and response writing `HttpHandler` functions.
   *
   * Each mime type must be mapped to a function which accepts an obj and returns an `HttpHandler` which will send a response in the associated mime type.
   * @example
   * new Map([["application/json", json], ["application/xml", xml]]);
   */
  get Rules(): Map<string, (obj: object) => HttpHandler>;

  /**
   * A `HttpHandler` function which will be invoked if none of the accepted mime types can be satisfied. Generally this `HttpHandler` would send a response with a status code of 406 Unacceptable.
   */
  get UnacceptableHandler(): HttpHandler;
}

// ---------------------------
// HttpContext extensions
// ---------------------------

export const NegotiateWithAsync = (
  ctx: HttpContext,
  negotiationRules: Map<string, (obj: object) => HttpHandler>,
  unacceptableHandler: HttpHandler,
  responseObj: object
) => {
  const acceptedMimeTypes = ctx.Request.GetTypedHeaders().Accept;
  if (acceptedMimeTypes == null || acceptedMimeTypes.length === 0) {
    const kv = pipe([...negotiationRules.values()], head);
    switch (kv._tag) {
      case "Some":
        kv.value(responseObj)(earlyReturn)(ctx);
      case "None":
        throw new Error("There are no negotiation rules");
    }
  }
};

export const NegotiateAsync = (ctx: HttpContext, responseObj: object) => {
  const config = ctx.GetService<INegotiationConfig>();
  return NegotiateWithAsync(
    ctx,
    config.Rules,
    config.UnacceptableHandler,
    responseObj
  );
};

export const negotiate =
  (responseObj: object): HttpHandler =>
  (_: HttpFunc) =>
  (ctx: HttpContext) =>
    NegotiateAsync(ctx, responseObj);
