import express from "express";

import { choose, compose, niraffe, route, text } from "./niraffe";

const webApp = choose([
  compose(route("/"))(text("Hello world, from Niraffe!")),
]);

const main = (args: string[]) => {
  const app = express();

  app.use(niraffe(webApp));

  app.listen(3000, () => {
    console.log("Express with TypeScript, http://localhost:3000");
  });
};

main(process.argv);
