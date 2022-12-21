package main

import (
	"fmt"

	token_parser "github.com/sheason2019/omi/omi-parser/token-parser"
)

const testContent = `struct Todo {
  string content;
  boolean finish;
  int32 createTime;
} // inline comments

/*test comment info*/
service Todo {
  repeated Todo GetTodoList();
  void PostTodo(Todo/*try*/todo); // 提交TODO信息
  void PutTodo(Todo todo);
  void DeleteTodo(Todo todo);
}`

func main() {
	tokens, _ := token_parser.Parse(testContent)

	for _, token := range tokens {
		fmt.Printf("%+v\n", token)
	}
}
