import axios, { AxiosInstance } from "axios";

interface ClientConfig {
  host?: string;
  ins?: AxiosInstance;
}

export interface GetTodoPayload {
  id?: number;
}

export class TemplateClient {
  host: string;
  ins: AxiosInstance;

  constructor(config?: ClientConfig) {
    this.host = config?.host ?? "";
    this.ins = config?.ins ?? axios.create();
  }

  GetTodo(payload: GetTodoPayload) {
    return this.ins.get<GetTodoPayload>(this.host + "/Import.Todo", {
      params: payload,
    });
  }

  PostTodo(payload: GetTodoPayload) {
    return this.ins.post<GetTodoPayload>(this.host + "/Import.Todo", payload);
  }
}
