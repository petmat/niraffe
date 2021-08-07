import { isNonEmpty, map, tail, zip } from "fp-ts/lib/Array";
import { head } from "fp-ts/lib/Array";
import { identity, pipe } from "fp-ts/lib/function";
import { head as neHead, tail as neTail } from "fp-ts/lib/NonEmptyArray";
import { Option, none, some } from "fp-ts/lib/Option";

// ---------------------------
// String matching functions
// ---------------------------

type Parser = <T>(v: string) => T;

const formatStringMap = new Map<string, [string, Parser]>([
  // In F# version this regexp was "(?i:(true|false)){1}" which is case-insensitive.
  // JavaScript does not support that syntax and we needed to make this case-sensitive.
  ["b", ["(true|false){1}", (s: string) => s === "true"] as [string, Parser]],
  ["c", ["([^/]{1})", identity] as [string, Parser]],
  ["s", ["([^/]+)", identity] as [string, Parser]],
  ["i", ["(-?\\d+)", (s: string) => parseInt(s)] as [string, Parser]],
  ["d", ["(-?\\d+)", (s: string) => parseInt(s)] as [string, Parser]],
  ["f", ["(-=\\d+.{1}\\d+)", (s: string) => parseFloat(s)] as [string, Parser]],
]);

enum MatchMode {
  Exact,
  StartsWith,
  EndsWith,
  Contains,
}

export abstract class MatchOptions {
  IgnoreCase!: boolean;
  MatchMode!: MatchMode;
  static Exact: MatchOptions = {
    IgnoreCase: false,
    MatchMode: MatchMode.Exact,
  };
  static IgnoreCaseExact: MatchOptions = {
    IgnoreCase: true,
    MatchMode: MatchMode.Exact,
  };
}

const convertToRegexPatternAndFormatChars =
  (mode: MatchMode) => (formatString: string) => {
    const convert = (chars: string[]): [string, string[]] => {
      const firstChar = head(chars);
      const cTail = tail(chars);

      if (firstChar._tag === "Some" && firstChar.value === "%") {
        if (cTail._tag === "Some" && isNonEmpty(cTail.value)) {
          const secondChar = neHead(cTail.value);
          const secondTail = neTail(cTail.value);

          if (secondChar === "%") {
            const [pattern, formatChars] = convert(secondTail);
            return [`%${pattern}`, formatChars];
          } else {
            const [pattern, formatChars] = convert(secondTail);
            const result = formatStringMap.get(secondChar);
            if (!result) {
              throw new Error(`Could not find format string '${secondChar}'`);
            }
            const [regex, _] = result;
            return [`${regex}${pattern}`, [secondChar, ...formatChars]];
          }
        }
      } else if (firstChar._tag === "Some" && cTail._tag === "Some") {
        const [pattern, formatChars] = convert(cTail.value);
        return [`${firstChar.value}${pattern}`, formatChars];
      }

      return ["", []];
    };

    const formatRegex = (mode: MatchMode, pattern: string) => {
      switch (mode) {
        case MatchMode.Exact:
          return `^${pattern}$`;
        case MatchMode.StartsWith:
          return `^${pattern}`;
        case MatchMode.EndsWith:
          return `${pattern}$`;
        case MatchMode.Contains:
          return pattern;
      }
    };

    return pipe(
      formatString,
      (s) => s.split(""),
      convert,
      ([pattern, formatChars]) => [formatRegex(mode, pattern), formatChars]
    );
  };

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Tries to parse an input string based on a given format string and return a tuple of all parsed arguments.
 * @param format The format string which shall be used for parsing.
 * @param options The options record with specifications on how the matching should behave.
 * @param input The input string from which the parsed arguments shall be extracted.
 * @returns Matched value as an option of T
 */
export const tryMatchInput =
  <TPath extends string>(format: TPath) =>
  (options: MatchOptions) =>
  (input: string): Option<ExtractFields<TPath>> => {
    try {
      const [pattern, formatChars] = pipe(
        format,
        escapeRegExp,
        convertToRegexPatternAndFormatChars(options.MatchMode)
      ) as [string, string[]];

      const regexOptions = options.IgnoreCase ? "i" : "";

      const result = input.match(new RegExp(pattern, regexOptions));

      if (!result) {
        return none;
      }

      // This might be wrong because .NET and JavaScript RegExp behave differently.
      if (result.length <= 1) {
        return none;
      } else {
        const groups = result.slice(1);

        const values = pipe(
          zip(groups, formatChars),
          map(([g, c]) => {
            const result = formatStringMap.get(c);
            if (!result) {
              throw new Error(`Could not find format string '${c}'`);
            }
            const [_, parser] = result;
            const value = parser(g);
            return value;
          })
        );

        return some(values as ExtractFields<TPath>);
      }
    } catch (_) {
      return none;
    }
  };

// ---------------------------
// Validation helper functions
// ---------------------------

export type FieldType<Field> = "b" extends Field
  ? boolean
  : "c" extends Field
  ? string
  : "s" extends Field
  ? string
  : "i" extends Field
  ? number
  : "d" extends Field
  ? number
  : "f" extends Field
  ? number
  : never;

export type ExtractFields<T> = T extends `${infer _}%${infer Field}${infer R}`
  ? [FieldType<Field>, ...ExtractFields<R>]
  : T extends `${infer _}%${infer Field}`
  ? [FieldType<Field>]
  : [];
