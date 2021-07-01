"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const function_1 = require("fp-ts/function");
const niraffe_1 = require("./niraffe");
const niraffe_viewEngine_1 = require("./niraffe.viewEngine");
// Views
const layout = (content) => niraffe_viewEngine_1.html([], [
    niraffe_viewEngine_1.head([], [
        niraffe_viewEngine_1.title([], [niraffe_viewEngine_1.encodedText("niraffe_test")]),
        niraffe_viewEngine_1.link([niraffe_viewEngine_1._rel("stylesheet"), niraffe_viewEngine_1._type("text/css"), niraffe_viewEngine_1._href("/main.css")]),
    ]),
    niraffe_viewEngine_1.body([], content),
]);
const partial = () => niraffe_viewEngine_1.h1([], [niraffe_viewEngine_1.encodedText("giraffe_test")]);
const index = (model) => function_1.pipe([partial(), niraffe_viewEngine_1.p([], [niraffe_viewEngine_1.encodedText(model.text)])], layout);
// Web app
const indexHandler = (name) => {
    const greetings = `Hello ${name}, from Niraffe!`;
    const model = { text: greetings };
    const view = index(model);
    niraffe_1.htmlView(view);
};
const webApp = () => niraffe_1.choose([niraffe_1.GET]);
// Error handler
const errorHandler = (err, logger) => {
    logger.LogError(err, "An unhandled error has occured while executing the request.");
    return niraffe_1.compose(niraffe_1.clearResponse)(niraffe_1.ServerErrors.INTERNAL_ERROR(err.message));
};
console.log("Hello world");
