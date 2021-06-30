import { Either, left } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { ap } from "fp-ts/lib/Identity";
import he from "he";

import { StringBuilder } from "../system/text/StringBuilder";
import { tap } from "../utils/array";
import { StringBuilderPool } from "./StringBuilderPool";

// ---------------------------
// Default HTML elements
// ---------------------------

// ---------------------------
// Definition of different HTML content
//
// For more info check:
// - https://developer.mozilla.org/en-US/docs/Web/HTML/Element
// - https://www.w3.org/TR/html5/syntax.html#void-elements
// ---------------------------

export type KeyValue = [string, string];
export type Boolean = string;
export type XmlAttribute = Either<KeyValue, Boolean>;

export type XmlElement = [string, XmlAttribute[]]; // Name and XML attributes

// An XML element which contains nested XML elements
export type ParentNode = { type: "ParentNode"; value: [XmlElement, XmlNode[]] };
// An XML element which cannot contain nested XML (e.g. <hr /> or <br />)
export type VoidElement = { type: "VoidElement"; value: XmlElement };
// Text content
export type Text = { type: "Text"; value: string };

export type XmlNode = ParentNode | VoidElement | Text;

// ---------------------------
// Helper functions
// ---------------------------

const encode = (value: string) => he.encode(value);

// ---------------------------
// Building blocks
// ---------------------------

const attr =
  (key: string) =>
  (value: string): XmlAttribute =>
    left([key, encode(value)]);

const tag =
  (tagName: string) =>
  (attributes: XmlAttribute[], contents: XmlNode[]): ParentNode => ({
    type: "ParentNode",
    value: [[tagName, attributes], contents],
  });

const voidTag =
  (tagName: string) =>
  (attributes: XmlAttribute[]): VoidElement => ({
    type: "VoidElement",
    value: [tagName, attributes],
  });

export const encodedText = (content: string): Text => ({
  type: "Text",
  value: encode(content),
});

// Default HTML elements

// Main root
export const html = tag("html");

// Document metadata
export const base = voidTag("base");
export const head = tag("head");
export const link = (attr: XmlAttribute[]) =>
  pipe(voidTag, ap("link"), ap(attr));
export const meta = (attr: XmlAttribute[]) =>
  pipe(voidTag, ap("meta"), ap(attr));
export const style = tag("style");
export const title = tag("title");

// Content sectioning
export const blockquote = tag("blockquote");
export const body = tag("body");
export const address = tag("address");
export const article = tag("article");
export const aside = tag("aside");
export const footer = tag("footer");
export const hgroup = tag("hgroup");
export const h1 = tag("h1");
export const h2 = tag("h2");
export const h3 = tag("h3");
export const h4 = tag("h4");
export const h5 = tag("h5");
export const h6 = tag("h6");
export const header = tag("header");
export const nav = tag("nav");
export const section = tag("section");

// Text content
export const dd = tag("dd");
export const div = tag("div");
export const dl = tag("dl");
export const dt = tag("dt");
export const figcaption = tag("figcaption");
export const figure = tag("figure");
export const hr = voidTag("hr");
export const li = tag("li");
export const main = tag("main");
export const ol = tag("ol");
export const p = tag("p");
export const pre = tag("pre");
export const ul = tag("ul");

// Default HTML attributes

export const _href = attr("href");
export const _rel = attr("rel");
export const _type = attr("type");

// Internal ViewBuilder

const apSb = (text: string) => (sb: StringBuilder) => sb.Append(text);

const selfClosingBracket = (isHtml: boolean) => (isHtml ? ">" : " />");

export const buildNode =
  (isHtml: boolean) =>
  (sb: StringBuilder, node: XmlNode): void => {
    const buildElement = (
      closingBracket: string,
      elemName: string,
      attributes: XmlAttribute[]
    ) => {
      if (attributes.length === 0) {
        pipe(sb, apSb("<"), apSb(elemName), apSb(closingBracket));
      } else {
        pipe(sb, apSb("<"), apSb(elemName));

        pipe(
          attributes,
          tap((attr) => {
            switch (attr._tag) {
              case "Left":
                const [k, v] = attr.left;
                pipe(sb, apSb(" "), apSb(k), apSb('="'), apSb(v), apSb('"'));
                break;
              case "Right":
                const bk = attr.right;
                pipe(sb, apSb(" "), apSb(bk));
            }
          })
        );

        pipe(sb, apSb(closingBracket));
      }
    };

    const buildParentNode =
      ([elemName, attributes]: [string, XmlAttribute[]]) =>
      (nodes: XmlNode[]) => {
        buildElement(">", elemName, attributes);

        for (const node of nodes) {
          buildNode(isHtml)(sb, node);
        }

        pipe(sb, apSb("</"), apSb(elemName), apSb(">"));
      };

    switch (node.type) {
      case "Text":
        pipe(sb, apSb(node.value));
        break;
      case "ParentNode": {
        const [e, nodes] = node.value;
        buildParentNode(e)(nodes);
        break;
      }
      case "VoidElement": {
        const [e, attributes] = node.value;
        buildElement(selfClosingBracket(isHtml), e, attributes);
      }
    }
  };

export namespace RenderView {
  export namespace IntoStringBuilder {
    export const xmlNode = buildNode(false);
    export const htmlNode = buildNode(true);

    export const xmlNodes = (sb: StringBuilder, nodes: XmlNode[]): void => {
      for (const n of nodes) {
        xmlNode(sb, n);
      }
    };

    export const htmlNodes = (sb: StringBuilder, nodes: XmlNode[]): void => {
      for (const n of nodes) {
        htmlNode(sb, n);
      }
    };

    export const htmlDocument = (
      sb: StringBuilder,
      document: XmlNode
    ): void => {
      pipe(sb, apSb("<!DOCTYPE html>"), apSb("\n"));
      htmlNode(sb, document);
    };
  }

  export namespace AsBytes {
    const outputAsBytes = (sb: StringBuilder) => {
      const enc = new TextEncoder();
      return enc.encode(sb.Value);
    };

    export const htmlDocument = (document: XmlNode): Uint8Array => {
      const sb = StringBuilderPool.Rent();
      IntoStringBuilder.htmlDocument(sb, document);
      return outputAsBytes(sb);
    };
  }
}
