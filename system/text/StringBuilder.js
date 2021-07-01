"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringBuilder = void 0;
class StringBuilder {
    constructor(capacity) {
        this.capacity = capacity;
        this.str = "";
    }
    get Capacity() {
        return this.capacity;
    }
    Append(value) {
        this.str += value;
        return this;
    }
    Clear() {
        this.str = "";
        return this;
    }
    get Value() {
        return this.str;
    }
}
exports.StringBuilder = StringBuilder;
