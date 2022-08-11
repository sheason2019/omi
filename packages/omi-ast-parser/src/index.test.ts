import * as fs from "fs";
import { OmiParser } from ".";

const testContent = `struct Todo {
  string content;
  boolean finish;
  int32 createTime;
} // inline comments

service Todo {
  repeated Todo GetTodoList();
  void PostTodo(Todo/*try*/todo); // 提交TODO信息
  void PutTodo(Todo todo);
  void DeleteTodo(Todo todo);
}`;

const parser = new OmiParser();
parser.setContent(testContent);
const result = parser.build();

fs.writeFileSync("dist/test.json", JSON.stringify(result, null, 2));
