"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerErrors = void 0;
const core_1 = require("./core");
const _1 = require(".");
const internalError = (x) => _1.compose(core_1.setStatusCode(500))(x);
exports.ServerErrors = {
    internalError,
    INTERNAL_ERROR: (x) => internalError(_1.negotiate(x)),
};
