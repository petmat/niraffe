import { HttpHandler, setStatusCode } from "./core";
import { compose, negotiate } from ".";

const internalError = (x: HttpHandler) => compose(setStatusCode(500))(x);

export const ServerErrors = {
  internalError,
  INTERNAL_ERROR: (x: any) => internalError(negotiate(x)),
};
