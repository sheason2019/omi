export interface Todo {
  id?: number;
  content?: string;
  finish?: boolean;
  createTime?: number;
  todoType?: Todo;
  ChildTodo?: Todo[];
}

export interface DeleteTodoPayload {
  id?: number;
}
