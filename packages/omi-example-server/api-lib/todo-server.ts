/**
 * 本文件由Omi.js自动生成，请勿随意改动
 * 生成时间：2022年8月8日 11:37:40.
 */

import { OmiLambda } from "omi-server";

export interface Todo {
  content: string;
  finish: boolean;
  createTime: number;
}
export abstract class UnimpledTodoController {
  namespace: string = "Todo";
  abstract GetTodoList: OmiLambda<{}, Todo[]>;
  abstract PostTodo: OmiLambda<{ todo: Todo }, void>;
  abstract PutTodo: OmiLambda<{ todo: Todo }, void>;
  abstract DeleteTodo: OmiLambda<{ todo: Todo }, void>;
}
