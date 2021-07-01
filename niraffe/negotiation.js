"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.negotiate = exports.NegotiateAsync = exports.NegotiateWithAsync = void 0;
const Array_1 = require("fp-ts/lib/Array");
const pipeable_1 = require("fp-ts/lib/pipeable");
const core_1 = require("./core");
// ---------------------------
// HttpContext extensions
// ---------------------------
const NegotiateWithAsync = (ctx, negotiationRules, unacceptableHandler, responseObj) => {
    const acceptedMimeTypes = ctx.Request.GetTypedHeaders().accept;
    if (acceptedMimeTypes == null || acceptedMimeTypes.length === 0) {
        const kv = pipeable_1.pipe([...negotiationRules.values()], Array_1.head);
        switch (kv._tag) {
            case "Some":
                kv.value(responseObj)(core_1.earlyReturn)(ctx);
            case "None":
                throw new Error("There are no negotiation rules");
        }
    }
    else {
        let mimeType = null;
        let bestQuality = Number.MIN_VALUE;
        let currQuality = 1;
        // Filter the list of acceptedMimeTypes by the negotiationRules
        // and selects the mimetype with the greatest quality
        for (const x of acceptedMimeTypes) {
            if ([...negotiationRules.keys()].includes(x)) {
                currQuality = 1;
                if (bestQuality < currQuality) {
                    bestQuality = currQuality;
                    mimeType = x;
                }
            }
        }
        if (mimeType == null) {
            return unacceptableHandler(core_1.earlyReturn)(ctx);
        }
        else {
            const negotiationRule = negotiationRules.get(mimeType);
            if (negotiationRule == null) {
                throw new Error("Could not get negotiation rule");
            }
            return negotiationRule(responseObj)(core_1.earlyReturn)(ctx);
        }
    }
};
exports.NegotiateWithAsync = NegotiateWithAsync;
const NegotiateAsync = (ctx, responseObj) => {
    const config = ctx.GetService("INegotiationConfig");
    if (config == null) {
        throw new Error("Negotiation config is not set in HttpContext.");
    }
    return exports.NegotiateWithAsync(ctx, config.Rules, config.UnacceptableHandler, responseObj);
};
exports.NegotiateAsync = NegotiateAsync;
const negotiate = (responseObj) => (_) => (ctx) => exports.NegotiateAsync(ctx, responseObj);
exports.negotiate = negotiate;
