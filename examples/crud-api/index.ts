import express from "express";
import { findFirst } from "fp-ts/lib/Array";

import {
  RequestErrors,
  choose,
  compose,
  json,
  niraffe,
  route,
  routef,
  text,
} from "../../niraffe";

interface Todo {
  id: number;
  name: string;
}

const TODOS: Todo[] = [
  { id: 1, name: "Do something" },
  { id: 2, name: "Do something again" },
  { id: 3, name: "Do something still" },
];

const getAllTodosHandler = json(TODOS);

const getTodoHandler = ([id]: [number]) => {
  console.log("ID", id);
  const todo = findFirst((t: Todo) => t.id === id)(TODOS);

  switch (todo._tag) {
    case "Some":
      return json(todo.value);
    case "None":
      return RequestErrors.NOT_FOUND(text("Not found"));
  }
};

const getFake = text("Hello");

const webApp = choose([
  compose(route("/api/todos"))(getAllTodosHandler),
  routef("/api/todos/%i", ["number"])(getTodoHandler),
]);

const main = (args: string[]) => {
  const app = express();

  app.use(niraffe(webApp));

  app.listen(3000, () => {
    console.log("Express with TypeScript, http://localhost:3000");
  });
};

main(process.argv);
