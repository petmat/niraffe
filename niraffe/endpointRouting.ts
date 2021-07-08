import { HttpHandler } from "./core";

enum HttpVerb {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTION = "OPTION",
  TRACE = "TRACE",
  CONNECT = "CONNECT",
  NotSpecified = "",
}

type RouteTemplate = string;
type RouteTemplateMappings = [string, string][];
type MetadataList = object[];

type SimpleEndpoint = {
  type: "SimpleEndpoint";
  value: [HttpVerb, RouteTemplate, HttpHandler, MetadataList];
};

type TemplateEndpoint = {
  type: "TemplateEndpoint";
  value: [
    HttpVerb,
    RouteTemplate,
    RouteTemplateMappings,
    (obj: object) => HttpHandler,
    MetadataList
  ];
};

type NestedEndpoint = {
  type: "NestedEndpoint";
  value: [RouteTemplate, Endpoint[], MetadataList];
};

type MultiEndpoint = {
  type: "MultiEndpoint";
  value: [Endpoint[]];
};

type Endpoint =
  | SimpleEndpoint
  | TemplateEndpoint
  | NestedEndpoint
  | MultiEndpoint;

export const route =
  (path: string) =>
  (handler: HttpHandler): Endpoint => ({
    type: "SimpleEndpoint",
    value: [HttpVerb.NotSpecified, path, handler, []],
  });
