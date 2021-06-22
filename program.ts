import { GET, choose } from "./niraffe/core";
import {
  XmlNode,
  _href,
  _rel,
  _type,
  body,
  encodedText,
  h1,
  head,
  html,
  link,
  p,
  title,
} from "./niraffe/viewEngine";

import { pipe } from "fp-ts/function";

type Message = {
  text: string;
};

// Views

const layout = (content: XmlNode[]) =>
  html(
    [],
    [
      head(
        [],
        [
          title([], [encodedText("niraffe_test")]),
          link([_rel("stylesheet"), _type("text/css"), _href("/main.css")]),
        ]
      ),
      body([], content),
    ]
  );

const partial = () => h1([], [encodedText("giraffe_test")]);

const index = (model: Message) =>
  pipe([partial(), p([], [encodedText(model.text)])], layout);

// Web app

const indexHandler = (name: string) => {
  const greetings = `Hello ${name}, from Niraffe!`;
  const model = { text: greetings };
  const view = index(model);
  htmlView(view);
};

const webApp = () => choose([GET]);

// Error handler

const errorHandler = (err: Error, logger: ILogger) => {
  logger.LogError(
    err,
    "An unhandled error has occured while executing the request."
  );
  clearRes;
};

console.log("Hello world");
