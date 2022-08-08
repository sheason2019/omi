/**
 * 本文件由Omi.js自动生成，请勿随意改动
 * 生成时间：2022年8月8日 23:45:2.
 */

import { OmiLambda } from "omi-server";

export interface Todo {
  content: string;
  finish: boolean;
  createTime: number;
}
export abstract class UnimpledTodoController {
  namespace: string = "Todo";
  abstract GetTodoList(
    ...args: Parameters<OmiLambda<{}, Todo[]>>
  ): ReturnType<OmiLambda<{}, Todo[]>>;
  abstract PostTodo(
    ...args: Parameters<OmiLambda<{ todo: Todo }, void>>
  ): ReturnType<OmiLambda<{ todo: Todo }, void>>;
  abstract PutTodo(
    ...args: Parameters<OmiLambda<{ todo: Todo }, void>>
  ): ReturnType<OmiLambda<{ todo: Todo }, void>>;
  abstract DeleteTodo(
    ...args: Parameters<OmiLambda<{ todo: Todo }, void>>
  ): ReturnType<OmiLambda<{ todo: Todo }, void>>;
}
