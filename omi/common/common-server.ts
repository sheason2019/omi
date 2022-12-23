import { Todo } from "../todo";
export interface Import {
GetTodo(id: number): Todo;
GetTodoType(): Todo;
}