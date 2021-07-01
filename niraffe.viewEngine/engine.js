"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderView = exports.buildNode = exports._type = exports._rel = exports._href = exports.ul = exports.pre = exports.p = exports.ol = exports.main = exports.li = exports.hr = exports.figure = exports.figcaption = exports.dt = exports.dl = exports.div = exports.dd = exports.section = exports.nav = exports.header = exports.h6 = exports.h5 = exports.h4 = exports.h3 = exports.h2 = exports.h1 = exports.hgroup = exports.footer = exports.aside = exports.article = exports.address = exports.body = exports.blockquote = exports.title = exports.style = exports.meta = exports.link = exports.head = exports.base = exports.html = exports.encodedText = void 0;
const Either_1 = require("fp-ts/lib/Either");
const function_1 = require("fp-ts/lib/function");
const Identity_1 = require("fp-ts/lib/Identity");
const he_1 = __importDefault(require("he"));
const array_1 = require("../utils/array");
const StringBuilderPool_1 = require("./StringBuilderPool");
// ---------------------------
// Helper functions
// ---------------------------
const encode = (value) => he_1.default.encode(value);
// ---------------------------
// Building blocks
// ---------------------------
const attr = (key) => (value) => Either_1.left([key, encode(value)]);
const tag = (tagName) => (attributes, contents) => ({
    type: "ParentNode",
    value: [[tagName, attributes], contents],
});
const voidTag = (tagName) => (attributes) => ({
    type: "VoidElement",
    value: [tagName, attributes],
});
const encodedText = (content) => ({
    type: "Text",
    value: encode(content),
});
exports.encodedText = encodedText;
// Default HTML elements
// Main root
exports.html = tag("html");
// Document metadata
exports.base = voidTag("base");
exports.head = tag("head");
const link = (attr) => function_1.pipe(voidTag, Identity_1.ap("link"), Identity_1.ap(attr));
exports.link = link;
const meta = (attr) => function_1.pipe(voidTag, Identity_1.ap("meta"), Identity_1.ap(attr));
exports.meta = meta;
exports.style = tag("style");
exports.title = tag("title");
// Content sectioning
exports.blockquote = tag("blockquote");
exports.body = tag("body");
exports.address = tag("address");
exports.article = tag("article");
exports.aside = tag("aside");
exports.footer = tag("footer");
exports.hgroup = tag("hgroup");
exports.h1 = tag("h1");
exports.h2 = tag("h2");
exports.h3 = tag("h3");
exports.h4 = tag("h4");
exports.h5 = tag("h5");
exports.h6 = tag("h6");
exports.header = tag("header");
exports.nav = tag("nav");
exports.section = tag("section");
// Text content
exports.dd = tag("dd");
exports.div = tag("div");
exports.dl = tag("dl");
exports.dt = tag("dt");
exports.figcaption = tag("figcaption");
exports.figure = tag("figure");
exports.hr = voidTag("hr");
exports.li = tag("li");
exports.main = tag("main");
exports.ol = tag("ol");
exports.p = tag("p");
exports.pre = tag("pre");
exports.ul = tag("ul");
// Default HTML attributes
exports._href = attr("href");
exports._rel = attr("rel");
exports._type = attr("type");
// Internal ViewBuilder
const apSb = (text) => (sb) => sb.Append(text);
const selfClosingBracket = (isHtml) => (isHtml ? ">" : " />");
const buildNode = (isHtml) => (sb, node) => {
    const buildElement = (closingBracket, elemName, attributes) => {
        if (attributes.length === 0) {
            function_1.pipe(sb, apSb("<"), apSb(elemName), apSb(closingBracket));
        }
        else {
            function_1.pipe(sb, apSb("<"), apSb(elemName));
            function_1.pipe(attributes, array_1.tap((attr) => {
                switch (attr._tag) {
                    case "Left":
                        const [k, v] = attr.left;
                        function_1.pipe(sb, apSb(" "), apSb(k), apSb('="'), apSb(v), apSb('"'));
                        break;
                    case "Right":
                        const bk = attr.right;
                        function_1.pipe(sb, apSb(" "), apSb(bk));
                }
            }));
            function_1.pipe(sb, apSb(closingBracket));
        }
    };
    const buildParentNode = ([elemName, attributes]) => (nodes) => {
        buildElement(">", elemName, attributes);
        for (const node of nodes) {
            exports.buildNode(isHtml)(sb, node);
        }
        function_1.pipe(sb, apSb("</"), apSb(elemName), apSb(">"));
    };
    switch (node.type) {
        case "Text":
            function_1.pipe(sb, apSb(node.value));
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
exports.buildNode = buildNode;
var RenderView;
(function (RenderView) {
    let IntoStringBuilder;
    (function (IntoStringBuilder) {
        IntoStringBuilder.xmlNode = exports.buildNode(false);
        IntoStringBuilder.htmlNode = exports.buildNode(true);
        IntoStringBuilder.xmlNodes = (sb, nodes) => {
            for (const n of nodes) {
                IntoStringBuilder.xmlNode(sb, n);
            }
        };
        IntoStringBuilder.htmlNodes = (sb, nodes) => {
            for (const n of nodes) {
                IntoStringBuilder.htmlNode(sb, n);
            }
        };
        IntoStringBuilder.htmlDocument = (sb, document) => {
            function_1.pipe(sb, apSb("<!DOCTYPE html>"), apSb("\n"));
            IntoStringBuilder.htmlNode(sb, document);
        };
    })(IntoStringBuilder = RenderView.IntoStringBuilder || (RenderView.IntoStringBuilder = {}));
    let AsBytes;
    (function (AsBytes) {
        const outputAsBytes = (sb) => {
            const enc = new TextEncoder();
            return enc.encode(sb.Value);
        };
        AsBytes.htmlDocument = (document) => {
            const sb = StringBuilderPool_1.StringBuilderPool.Rent();
            IntoStringBuilder.htmlDocument(sb, document);
            return outputAsBytes(sb);
        };
    })(AsBytes = RenderView.AsBytes || (RenderView.AsBytes = {}));
})(RenderView = exports.RenderView || (exports.RenderView = {}));
