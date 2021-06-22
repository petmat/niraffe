import O from "fp-ts/lib/Option";

export interface HttpContext {
  SetContentType: (value: string) => void;
  WriteBytesAsync: (bytes: Uint8Array) => Promise<O.Option<HttpContext>>;
}
