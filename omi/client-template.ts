import axios, { AxiosInstance } from "axios";
import { Todo } from "./todo";

export class TodoClient {
  private ins: AxiosInstance;

  constructor(ins: AxiosInstance) {
    this.ins = ins ?? axios.create();
  }

  GetTodoList(): Promise<Todo> {
    return this.ins.get<void, Todo>("Todo.GetTodoList", { params: {} });
  }
  GetTodo(paylaod: number) {
    return this.ins.get<number, Todo>("Todo.GetTodo", { params: paylaod });
  }
}

// Todo GetTodoList();
// GetTodo(id: number): Todo;
