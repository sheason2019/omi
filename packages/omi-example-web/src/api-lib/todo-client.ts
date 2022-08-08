/**
 * 本文件由Omi.js自动生成，请勿随意改动
 * 生成时间：2022年8月8日 11:47:44.
 */

import { OmiClientBase } from "omi-client";
import { AxiosRequestConfig } from "axios";

export interface Todo {
  content: string;
  finish: boolean;
  createTime: number;
}
export class TodoClient extends OmiClientBase {
  GetTodoList(props: {}, option?: Omit<AxiosRequestConfig, "params">) {
    const url = "Todo.TodoList";
    const method = "Get";
    return this.request<Todo[]>(url, method, props, option);
  }
  PostTodo(props: { todo: Todo }, option?: Omit<AxiosRequestConfig, "params">) {
    const url = "Todo.Todo";
    const method = "Post";
    return this.request<void>(url, method, props, option);
  }
  PutTodo(props: { todo: Todo }, option?: Omit<AxiosRequestConfig, "params">) {
    const url = "Todo.Todo";
    const method = "Put";
    return this.request<void>(url, method, props, option);
  }
  DeleteTodo(
    props: { todo: Todo },
    option?: Omit<AxiosRequestConfig, "params">
  ) {
    const url = "Todo.Todo";
    const method = "Delete";
    return this.request<void>(url, method, props, option);
  }
}
