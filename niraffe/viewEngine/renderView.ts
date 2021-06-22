import { buildNode, XmlNode } from ".";
import { StringBuilder } from "../../system/text/StringBuilder";
import { StringBuilderPool } from "./StringBuilderPool";

const IntoStringBuilder = {
  xmlNode: buildNode(false),
  htmlNode: buildNode(true),

  // TODO: continue here
  xmlNodes: (sb: StringBuilder, nodes: XmlNode[]) => {
    for (const n of nodes) {
      this.xmlNode(sb, n)
    }
  }
}

export const AsBytes: {
  htmlDocument: (document: XmlNode): Uint8Array => {
    const db = StringBuilderPool.Rent();
    IntoStringBuilder.htmlDocument(sb, document);
    return outputAsBytes(sb);
  },
},