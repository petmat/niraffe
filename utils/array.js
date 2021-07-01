"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.head = exports.isEmptyArray = exports.tap = void 0;
/**
 * Iterates over an array and performs a side effect on each, some or none of the items.
 * @param callbackFn The function that performs the side effect.
 * @param arr The array that is iterated over.
 */
const tap = (callbackFn) => (arr) => {
    for (const v of arr) {
        callbackFn(v);
    }
};
exports.tap = tap;
const isEmptyArray = (a) => a.length === 0;
exports.isEmptyArray = isEmptyArray;
const head = (arr) => {
    if (arr.length === 0) {
        throw new Error("Array does not have any elements.");
    }
    return arr[0];
};
exports.head = head;
