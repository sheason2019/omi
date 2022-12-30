import axios, { AxiosInstance } from "axios";
import { Todo } from "../todo";
import { GetTodoPayload } from ".";

interface ClientConfig {
  host?: string;
  ins?: AxiosInstance;
}
export class ImportClient {
  host: string;
  ins: AxiosInstance;

  constructor(config?: ClientConfig) {
    this.host = config?.host ?? "";
    this.ins = config?.ins ?? axios.create();
  }
  GetTodo(payload: GetTodoPayload) {
    return this.ins.get<Todo>(this.host + "/Import.Todo", { params: payload });
  }
  GetTodoType() {
    return this.ins.get<Todo>(this.host + "/Import.TodoType");
  }
}
