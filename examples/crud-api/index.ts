import express from "express";
import { findFirst } from "fp-ts/lib/Array";
import * as t from "io-ts";

import { HttpContext } from "../../aspnetcore/http";
import {
  GET,
  HttpFunc,
  POST,
  PUT,
  RequestErrors,
  Successful,
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

const todoSchema = t.type({
  id: t.number,
  name: t.string,
});

const TODOS: Todo[] = [
  { id: 1, name: "Do something" },
  { id: 2, name: "Do something again" },
  { id: 3, name: "Do something still" },
];

const getAllTodosHandler = json(TODOS);

const getTodoHandler = ([id]: [number]) => {
  const todo = findFirst((t: Todo) => t.id === id)(TODOS);

  switch (todo._tag) {
    case "Some":
      return json(todo.value);
    case "None":
      return RequestErrors.NOT_FOUND("Not found");
  }
};

const createTodoHandler = (next: HttpFunc) => (ctx: HttpContext) => {
  const todo = ctx.BindJsonAsync(todoSchema);
  TODOS.push(todo);
  return Successful.OK(todo)(next)(ctx);
};

const updateTodoHandler =
  ([id]: [number]) =>
  (next: HttpFunc) =>
  (ctx: HttpContext) => {
    const newTodo = ctx.BindJsonAsync(todoSchema);
    const todo = findFirst((t: Todo) => t.id === id)(TODOS);

    switch (todo._tag) {
      case "Some":
        todo.value.name = newTodo.name;
        return json(todo.value)(next)(ctx);
      case "None":
        return RequestErrors.NOT_FOUND("Not found")(next)(ctx);
    }
  };

const webApp = choose([
  compose(GET)(
    choose([
      compose(route("/api/todos"))(getAllTodosHandler),
      routef("/api/todos/%i", ["number"])(getTodoHandler),
    ])
  ),
  compose(POST)(choose([compose(route("/api/todos"))(createTodoHandler)])),
  compose(PUT)(
    choose([routef("/api/todos/%i", ["number"])(updateTodoHandler)])
  ),
]);

const main = (args: string[]) => {
  const app = express();

  app.use(express.json());
  app.use(niraffe(webApp));

  app.listen(3000, () => {
    console.log("Express with TypeScript, http://localhost:3000");
  });
};

main(process.argv);
