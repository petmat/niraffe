import { map } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { ap } from "fp-ts/lib/Identity";
import { Option, none, some } from "fp-ts/lib/Option";

import { HttpContext, HttpMethods } from "../aspnetcore/http";
import { ILogger } from "../microsoft/extensions/logging";
import { RenderView, XmlNode } from "../niraffe.viewEngine";
import { isEmptyArray } from "../utils/array";

/**
 * A type alias for `Promise<Option<HttpContext>>` which represents the result of an HTTP function (HttpFunc).
 * If the result is Some HttpContext then the Niraffe middleware will return the response to the client and end the pipeline. However, if the result is None then the Giraffe middleware will continue the express pipeline by invoking the next middleware.
 */
export type HttpFuncResult = Promise<Option<HttpContext>>;

/**
 * A HTTP function which takes an `HttpContext` object and returns a `HttpFuncResult`.
 * The function may inspect the incoming `HttpRequest` and make modifications to the `HttpResponse` before returning a `HttpFuncResult`. The result can be either a `Promise` of Some HttpContext or a `Promise` of None.
 * If the result is Some HttpContext then the Niraffe middleware will return the response to the client and end the pipeline. However, if the result is None then the Niraffe middleware will continue the express pipeline by invoking the next middleware.
 */
export type HttpFunc = (ctx: HttpContext) => HttpFuncResult;

/**
 * A HTTP handler is the core building block of a Niraffe web application. It works similarly to express middleware where it is self responsible for invoking the next `HttpFunc` function or shortcircuit the execution by directly returning a `Promise` of HttpContext option.
 */
export type HttpHandler = (
  next: HttpFunc
) => (ctx: HttpContext) => HttpFuncResult;

/**
 * The error handler function takes an `Error` object as well as an `ILogger` instance and returns a `HttpHandler` function which takes care of handling any uncaught application errors.
 */
export type ErrorHandler = (exn: Error) => (logger: ILogger) => HttpHandler;

// ---------------------------
// Globally useful functions
// ---------------------------

/**
 * Use skipPipeline to shortcircuit the `HttpHandler` pipeline and return None to the surrounding `HttpHandler` or the Giraffe middleware (which would subsequently invoke the next middleware as a result of it).
 */
export const skipPipeline: HttpFuncResult = Promise.resolve(none);

export const earlyReturn: HttpFunc = (ctx: HttpContext) =>
  Promise.resolve(some(ctx));

// ---------------------------
// Default Combinators
// ---------------------------

export const compose =
  (handler1: HttpHandler) =>
  (handler2: HttpHandler): HttpHandler =>
  (final: HttpFunc) => {
    const func = pipe(pipe(final, handler2), handler1);
    return (ctx: HttpContext) => {
      switch (ctx.Response.HasStarted) {
        case true:
          return final(ctx);
        case false:
          return func(ctx);
      }
    };
  };

/**
 * Iterates through a list of `HttpFunc` functions and returns the result of the first `HttpFunc` of which the outcome is `Some HttpContext`.
 * @param funcs
 * @param ctx
 * @returns A `HttpFuncResult`.
 */
export const chooseHttpFunc =
  (funcs: HttpFunc[]): HttpFunc =>
  async (ctx: HttpContext) => {
    if (isEmptyArray(funcs)) {
      return none;
    }

    const [func, ...tail] = funcs;
    const result = await func(ctx);
    switch (result._tag) {
      case "Some":
        return result;
      case "None":
        return await pipe(chooseHttpFunc, ap(tail), ap(ctx));
    }
  };

/**
 * Iterates through a list of HttpHandler functions and returns the result of the first HttpHandler of which the outcome is Some HttpContext.
 * Please mind that all HttpHandler functions will get pre-evaluated at runtime by applying the next (HttpFunc) parameter to each handler.
 * @param handlers
 * @param next
 * @returns A `HttpFunc`.
 */
export const choose =
  (handlers: HttpHandler[]): HttpHandler =>
  (next: HttpFunc) => {
    const funcs = pipe(
      handlers,
      map((h) => h(next))
    );
    return (ctx: HttpContext) => pipe(chooseHttpFunc, ap(funcs), ap(ctx));
  };

// Default HttpHandlers

const httpVerb = (validate: (s: string) => boolean): HttpHandler => {
  return (next: HttpFunc) => (ctx: HttpContext) => {
    return validate(ctx.Request.Method) ? next(ctx) : skipPipeline;
  };
};

export const GET: HttpHandler = httpVerb(HttpMethods.IsGet);
export const POST: HttpHandler = httpVerb(HttpMethods.IsPost);
export const PUT: HttpHandler = httpVerb(HttpMethods.IsPut);

/**
 * Clears the current `HttpResponse` object.
 * This can be useful if a `HttpHandler` functions needs to overwrite the response of all previous `HttpHandler` functions with its own response (most commonly used by an `ErrorHandler` function).
 * @param next
 * @param ctx
 * @returns A Niraffe `HttpHandler` function which can be composed into a bigger web application.
 */
export const clearResponse: HttpHandler =
  (next: HttpFunc) => (ctx: HttpContext) => {
    ctx.Response.Clear();
    return next(ctx);
  };

/**
 * Sets the HTTP status code of the response.
 * @param statusCode The status code to be set in the response.
 * @param next
 * @param ctx
 * @returns A Niraffe `HttpHandler` function which can be composed into a bigger web application.
 */
export const setStatusCode =
  (statusCode: number): HttpHandler =>
  (next: HttpFunc) =>
  (ctx: HttpContext) => {
    ctx.SetStatusCode(statusCode);
    return next(ctx);
  };

// ---------------------------
// Response writing functions
// ---------------------------

export const text = (str: string): HttpHandler => {
  const bytes = new TextEncoder().encode(str);
  return (_: HttpFunc) => (ctx: HttpContext) => {
    ctx.SetContentType("text/plain; charset=utf-8");
    return ctx.WriteBytesAsync(bytes);
  };
};

export const json =
  <T>(dataObj: T): HttpHandler =>
  (_: HttpFunc) =>
  (ctx: HttpContext) =>
    ctx.WriteJsonAsync(dataObj);

/**
 * Compiles a `Niraffe.NiraffeViewEngine.XmlNode` object to a HTML view and writes the output to the body of the HTTP response.
 * @param htmlView An `XmlNode` object to be sent back to the client and which represents a valid HTML view.
 * @returns A Niraffe `HttpHandler` function which can be composed into a bigger web application.
 */
export const htmlView = (htmlView: XmlNode): HttpHandler => {
  const bytes = RenderView.AsBytes.htmlDocument(htmlView);
  return (_: HttpFunc) => (ctx: HttpContext) => {
    ctx.SetContentType("text/html; charset=utf-8");
    return ctx.WriteBytesAsync(bytes);
  };
};
