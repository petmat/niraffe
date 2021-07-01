"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringBuilderPool = void 0;
const StringBuilder_1 = require("../system/text/StringBuilder");
const PoolLimits = {
    MinimumCapacity: 5000,
    MaximumCapacity: 40000,
    MaximumLifetime: 10 * 60 * 1000, // 10 min in ms
};
class StringBuilderPool {
    static get IsEnabled() {
        return this.isEnabled;
    }
    static set IsEnabled(value) {
        this.isEnabled = value;
    }
    static Rent() {
        switch (StringBuilderPool.IsEnabled) {
            case false:
                return new StringBuilder_1.StringBuilder(PoolLimits.MinimumCapacity);
            case true: {
                const lifetime = new Date().getTime() - StringBuilderPool.created.getTime();
                const expired = lifetime > PoolLimits.MaximumLifetime;
                const sb = StringBuilderPool.instance;
                if (!expired && sb) {
                    StringBuilderPool.instance = null;
                    return sb.Clear();
                }
                else {
                    return new StringBuilder_1.StringBuilder(PoolLimits.MinimumCapacity);
                }
            }
        }
    }
    static Release(sb) {
        if (sb.Capacity <= PoolLimits.MaximumCapacity) {
            StringBuilderPool.instance = sb;
            StringBuilderPool.created = new Date();
        }
    }
}
exports.StringBuilderPool = StringBuilderPool;
