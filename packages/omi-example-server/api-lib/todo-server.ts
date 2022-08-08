/**
 * 本文件由Omi.js自动生成，请勿随意改动
 * 生成时间：2022年8月9日 0:7:27.
 */

import { OmiServerCtx } from "omi-server";

export interface Todo {
  content: string;
  finish: boolean;
  createTime: number;
}
export abstract class UnimpledTodoController {
  namespace: string = "Todo";
  abstract GetTodoList({ props }: OmiServerCtx<{}>): Promise<Todo[]> | Todo[];
  abstract PostTodo({
    props,
  }: OmiServerCtx<{ todo: Todo }>): Promise<void> | void;
  abstract PutTodo({
    props,
  }: OmiServerCtx<{ todo: Todo }>): Promise<void> | void;
  abstract DeleteTodo({
    props,
  }: OmiServerCtx<{ todo: Todo }>): Promise<void> | void;
}
