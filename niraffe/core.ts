import A from "fp-ts/lib/Array";
import O from "fp-ts/lib/Option";
import { XmlNode } from "./viewEngine";
import { pipe } from "fp-ts/lib/function";
import { ap } from "fp-ts/lib/Identity";
import { HttpContext } from "../aspnetcore/http";

type HttpFuncResult = Promise<O.Option<HttpContext>>;

type HttpFunc = (ctx: HttpContext) => HttpFuncResult;

type HttpHandler = (next: HttpFunc) => HttpFunc;

export const isEmptyArray = (a: unknown[]): a is [] => a.length === 0;

/**
 * Iterates through a list of `HttpFunc` functions and returns the result of the first `HttpFunc` of which the outcome is `Some HttpContext`.
 * @param funcs
 * @returns HttpFuncResult
 */
export const chooseHttpFunc = (funcs: HttpFunc[]): HttpFunc => async (
  ctx: HttpContext
) => {
  if (isEmptyArray(funcs)) {
    return O.none;
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

// Iterates through a list of HttpHandler functions and returns the result of
// the first HttpHandler of which the outcome is Some HttpContext.
// Please mind that all HttpHandler functions will get pre-evaluated at runtime
// by applying the next (HttpFunc) parameter to each handler.
export const choose = (handlers: HttpHandler[]): HttpHandler => (
  next: HttpFunc
) => {
  const funcs = pipe(
    handlers,
    A.map((h) => h(next))
  );
  return (ctx: HttpContext) => pipe(chooseHttpFunc, ap(funcs), ap(ctx));
};

export const GET = () => ({});

export const htmlView = (htmlView: XmlNode): HttpHandler => {
  const bytes = htmlDocument(htmlView);
  return (_: HttpFunc) => (ctx: HttpContext) => {
    ctx.SetContentType("text/html; charset=utf-8");
    return ctx.WriteBytesAsync(bytes);
  };
};
