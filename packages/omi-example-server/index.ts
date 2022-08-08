import OmiServer, { OmiLambda } from "omi-server";
import { Todo, UnimpledTodoController } from "./api-lib/todo-server";

const todos: Todo[] = [];

class TodoController extends UnimpledTodoController {
  PutTodo: OmiLambda<{ todo: Todo }, void> = ({ props }) => {
    const { todo } = props;
    for (const i in todos) {
      if (todos[i].createTime === todo.createTime) {
        todos[i] = todo;
        break;
      }
    }
  };
  DeleteTodo: OmiLambda<{ todo: Todo }, void> = ({ props }) => {
    const { todo } = props;
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].createTime === todo.createTime) {
        todos.splice(i, 1);
        break;
      }
    }
  };
  GetTodoList: OmiLambda<{}, Todo[]> = ({ props }) => {
    return todos;
  };

  PostTodo: OmiLambda<{ todo: Todo }, void> = ({ props }) => {
    const { todo } = props;
    todos.push(todo);
  };
}

const server = new OmiServer();
server.appendController(TodoController);
server.build();
server.listen(8080);
