import { OmiParser } from ".";

const testContent = `struct Todo {
  string content;
  boolean finish;
  int32 createTime;
}

service Todo {
  repeated Todo GetTodoList();
  void PostTodo(Todo todo);
  void PutTodo(Todo todo);
  void DeleteTodo(Todo todo);
}`;

const parser = new OmiParser();
parser.setContent(testContent);
const result = parser.build();
console.log(result);
