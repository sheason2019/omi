package token_parser_test

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"
)

const testContentB = `
struct Todo {
  int id;
  string content;
  boolean finish;
  int createTime;
  optional TodoType todoType;
  repeated Todo ChildTodo;
}

// block
service ITodo {
  repeated Todo GetTodoList();
  void PostTodo(string content, int id, repeated Todo childTodo);
  void DeleteTodo(repeated int ids);
  void PutTodo(Todo todo);
  void DeleteTodo(int id);
  void Login();
}
`

func TestRowsSplit(t *testing.T) {
	rows := strings.Split(testContentB, "\n")
	jsonStr, _ := json.Marshal(rows)
	fmt.Println(string(jsonStr))
}
