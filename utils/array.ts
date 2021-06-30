/**
 * Iterates over an array and performs a side effect on each, some or none of the items.
 * @param callbackFn The function that performs the side effect.
 * @param arr The array that is iterated over.
 */
export const tap =
  <T>(callbackFn: (v: T) => void) =>
  (arr: T[]): void => {
    for (const v of arr) {
      callbackFn(v);
    }
  };

export const isEmptyArray = (a: unknown[]): a is [] => a.length === 0;

export const head = (arr: any[]) => {
  if (arr.length === 0) {
    throw new Error("Array does not have any elements.");
  }
  return arr[0];
};
