import axios, { AxiosInstance } from "axios";
import { GetTodoPayload } from ".";
import { Todo } from "../todo";

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
return this.ins.get<Todo>(this.host + "/Import.Todo", { params: payload });}
GetTodoType() {
return this.ins.get<Todo>(this.host + "/Import.TodoType");}
}