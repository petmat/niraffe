import { HttpHandler, setStatusCode } from "./core";
import { compose, negotiate } from ".";

const ok = (x: HttpHandler) => compose(setStatusCode(200))(x);

export const Successful = {
  ok,
  OK: (x: any) => ok(negotiate(x)),
};

const internalError = (x: HttpHandler) => compose(setStatusCode(500))(x);

export const ServerErrors = {
  internalError,
  INTERNAL_ERROR: (x: any) => internalError(negotiate(x)),
};

const notFound = (x: HttpHandler) => compose(setStatusCode(404))(x);

export const RequestErrors = {
  notFound,
  NOT_FOUND: (x: any) => notFound(negotiate(x)),
};
