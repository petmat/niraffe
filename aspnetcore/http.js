"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpMethods = exports.HttpContext = exports.HttpResponse = exports.HttpRequest = void 0;
const Option_1 = require("fp-ts/lib/Option");
class HttpRequest {
    constructor(req) {
        this.req = req;
    }
    get Method() {
        return this.req.method;
    }
    GetTypedHeaders() {
        return this.req.headers;
    }
}
exports.HttpRequest = HttpRequest;
class HttpResponse {
    constructor(res) {
        this.res = res;
    }
    get HasStarted() {
        return false;
    }
    Clear() {
        if (this.HasStarted) {
            throw new Error("The response cannot be cleared, it has already started sending.");
        }
        this.res.statusCode = 200;
        // TODO: also reset back to some sane defaults for the headers
    }
}
exports.HttpResponse = HttpResponse;
class HttpContext {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this.httpReq = new HttpRequest(req);
        this.httpRes = new HttpResponse(res);
        this.services = new Map();
    }
    SetContentType(value) {
        this.res.setHeader("Content-Type", value);
    }
    WriteBytesAsync(bytes) {
        this.res.send(bytes);
        return Promise.resolve(Option_1.some(this));
    }
    get Request() {
        return this.httpReq;
    }
    get Response() {
        return this.httpRes;
    }
    SetStatusCode(statusCode) {
        this.res.status(statusCode);
    }
    SetService(name, service) {
        this.services.set("name", service);
    }
    GetService(name) {
        switch (name) {
            case "INegotiationConfig":
                return this.services.get(name);
            default:
                return null;
        }
    }
}
exports.HttpContext = HttpContext;
exports.HttpMethods = {
    IsGet: (method) => (method === null || method === void 0 ? void 0 : method.toLowerCase()) === "get",
};
