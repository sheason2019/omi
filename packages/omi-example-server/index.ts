import OmiServer, { OmiServerCtx } from "omi-server";
import { Todo, UnimpledTodoController } from "./api-lib/todo-server";

const todos: Todo[] = [];

class TodoController extends UnimpledTodoController {
  async PostTodo({ props }: OmiServerCtx<{ todo: Todo }>): Promise<void> {
    const { todo } = props;
    todos.push(todo);
  }
  async PutTodo({ props }: OmiServerCtx<{ todo: Todo }>): Promise<void> {
    const { todo } = props;
    for (const i in todos) {
      if (todos[i].createTime === todo.createTime) {
        todos[i] = todo;
        break;
      }
    }
  }
  async DeleteTodo({ props }: OmiServerCtx<{ todo: Todo }>): Promise<void> {
    const { todo } = props;
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].createTime === todo.createTime) {
        todos.splice(i, 1);
        break;
      }
    }
  }
  async GetTodoList(ctx: OmiServerCtx<{}>): Promise<Todo[]> {
    return todos;
  }
}

const server = new OmiServer();
server.appendController(TodoController);
server.build();
server.listen(8080);
