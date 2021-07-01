import { Request, Response, response } from "express";
import { Option, some } from "fp-ts/lib/Option";

export class HttpRequest {
  constructor(private req: Request) {}

  get Method(): string {
    return this.req.method;
  }

  GetTypedHeaders() {
    return this.req.headers;
  }
}

export class HttpResponse {
  constructor(private res: Response) {}

  get HasStarted(): boolean {
    return false;
  }

  Clear(): void {
    if (this.HasStarted) {
      throw new Error(
        "The response cannot be cleared, it has already started sending."
      );
    }
    this.res.statusCode = 200;
    // TODO: also reset back to some sane defaults for the headers
  }
}

export class HttpContext {
  private httpReq: HttpRequest;
  private httpRes: HttpResponse;
  private services: Map<string, unknown>;
  private items: Map<string, string>;

  constructor(private req: Request, private res: Response) {
    this.httpReq = new HttpRequest(req);
    this.httpRes = new HttpResponse(res);
    this.services = new Map<string, unknown>();
    this.items = new Map<string, string>();
  }

  SetContentType(value: string) {
    this.res.setHeader("Content-Type", value);
  }
  WriteBytesAsync(bytes: Uint8Array): Promise<Option<HttpContext>> {
    this.res.send(bytes);
    return Promise.resolve(some(this));
  }
  get Request(): HttpRequest {
    return this.httpReq;
  }
  get Response(): HttpResponse {
    return this.httpRes;
  }
  SetStatusCode(statusCode: number) {
    this.res.status(statusCode);
  }

  SetService(name: string, service: unknown): void {
    this.services.set(name, service);
  }

  GetService<T>(name: string): T | null {
    switch (name) {
      case "INegotiationConfig":
        return this.services.get(name) as T;
      default:
        return null;
    }
  }

  get Items(): Map<string, string> {
    return this.items;
  }
}

export const HttpMethods = {
  IsGet: (method: string) => method?.toLowerCase() === "get",
};
