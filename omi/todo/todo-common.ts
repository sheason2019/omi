export interface Todo {
id?: number;
content?: string;
finish?: boolean;
createTime?: number;
todoType?: Todo;
ChildTodo?: Todo[];
}
