"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlView = exports.setStatusCode = exports.clearResponse = exports.GET = exports.choose = exports.chooseHttpFunc = exports.compose = exports.earlyReturn = exports.skipPipeline = void 0;
const Array_1 = __importDefault(require("fp-ts/lib/Array"));
const function_1 = require("fp-ts/lib/function");
const Identity_1 = require("fp-ts/lib/Identity");
const Option_1 = require("fp-ts/lib/Option");
const http_1 = require("../aspnetcore/http");
const niraffe_viewEngine_1 = require("../niraffe.viewEngine");
const array_1 = require("../utils/array");
// ---------------------------
// Globally useful functions
// ---------------------------
/**
 * Use skipPipeline to shortcircuit the `HttpHandler` pipeline and return None to the surrounding `HttpHandler` or the Giraffe middleware (which would subsequently invoke the next middleware as a result of it).
 */
exports.skipPipeline = Promise.resolve(Option_1.none);
const earlyReturn = (ctx) => Promise.resolve(Option_1.some(ctx));
exports.earlyReturn = earlyReturn;
// ---------------------------
// Default Combinators
// ---------------------------
const compose = (handler1) => (handler2) => (final) => {
    const func = function_1.pipe(function_1.pipe(final, handler2), handler1);
    return (ctx) => {
        switch (ctx.Response.HasStarted) {
            case true:
                return final(ctx);
            case false:
                return func(ctx);
        }
    };
};
exports.compose = compose;
/**
 * Iterates through a list of `HttpFunc` functions and returns the result of the first `HttpFunc` of which the outcome is `Some HttpContext`.
 * @param funcs
 * @param ctx
 * @returns A `HttpFuncResult`.
 */
const chooseHttpFunc = (funcs) => async (ctx) => {
    if (array_1.isEmptyArray(funcs)) {
        return Option_1.none;
    }
    const [func, ...tail] = funcs;
    const result = await func(ctx);
    switch (result._tag) {
        case "Some":
            return result;
        case "None":
            return await function_1.pipe(exports.chooseHttpFunc, Identity_1.ap(tail), Identity_1.ap(ctx));
    }
};
exports.chooseHttpFunc = chooseHttpFunc;
/**
 * Iterates through a list of HttpHandler functions and returns the result of the first HttpHandler of which the outcome is Some HttpContext.
 * Please mind that all HttpHandler functions will get pre-evaluated at runtime by applying the next (HttpFunc) parameter to each handler.
 * @param handlers
 * @param next
 * @returns A `HttpFunc`.
 */
const choose = (handlers) => (next) => {
    const funcs = function_1.pipe(handlers, Array_1.default.map((h) => h(next)));
    return (ctx) => function_1.pipe(exports.chooseHttpFunc, Identity_1.ap(funcs), Identity_1.ap(ctx));
};
exports.choose = choose;
// Default HttpHandlers
const httpVerb = (validate) => {
    return (next) => (ctx) => {
        return validate(ctx.Request.Method) ? next(ctx) : exports.skipPipeline;
    };
};
exports.GET = httpVerb(http_1.HttpMethods.IsGet);
/**
 * Clears the current `HttpResponse` object.
 * This can be useful if a `HttpHandler` functions needs to overwrite the response of all previous `HttpHandler` functions with its own response (most commonly used by an `ErrorHandler` function).
 * @param next
 * @param ctx
 * @returns A Niraffe `HttpHandler` function which can be composed into a bigger web application.
 */
const clearResponse = (next) => (ctx) => {
    ctx.Response.Clear();
    return next(ctx);
};
exports.clearResponse = clearResponse;
/**
 * Sets the HTTP status code of the response.
 * @param statusCode The status code to be set in the response.
 * @param next
 * @param ctx
 * @returns A Niraffe `HttpHandler` function which can be composed into a bigger web application.
 */
const setStatusCode = (statusCode) => (next) => (ctx) => {
    ctx.SetStatusCode(statusCode);
    return next(ctx);
};
exports.setStatusCode = setStatusCode;
// Response writing functions
/**
 * Compiles a `Niraffe.NiraffeViewEngine.XmlNode` object to a HTML view and writes the output to the body of the HTTP response.
 * @param htmlView An `XmlNode` object to be sent back to the client and which represents a valid HTML view.
 * @returns A Niraffe `HttpHandler` function which can be composed into a bigger web application.
 */
const htmlView = (htmlView) => {
    const bytes = niraffe_viewEngine_1.RenderView.AsBytes.htmlDocument(htmlView);
    return (_) => (ctx) => {
        ctx.SetContentType("text/html; charset=utf-8");
        return ctx.WriteBytesAsync(bytes);
    };
};
exports.htmlView = htmlView;
