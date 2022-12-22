package main_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"testing"

	token_parser "github.com/sheason2019/omi/omi-parser/token-parser"
	tree_builder "github.com/sheason2019/omi/omi-parser/tree-builder"
)

const testContentA = `
import { Todo, TodoType } from "./todo.omi";

service Import {
  Todo GetTodo(int id);
  TodoType GetTodoType();
}
`

const testContentB = `
struct Todo {
  int id;
  string content;
  boolean finish;
  int createTime;
  TodoType todoType;
  Todo ChildTodo;
}

// block
service ITodo {
  Todo GetTodoList();
  void PostTodo(string content);
  void PutTodo(Todo todo);
  void DeleteTodo(int id);
  void Login();
}
`

var testList = []string{testContentB}

func TestMain(t *testing.T) {
	for _, content := range testList {
		tokens, _ := token_parser.Parse(content)
		ctx := tree_builder.Build(&tokens)

		jsonBytes, err := json.Marshal(ctx)
		if err != nil {
			panic(err)
		}

		var jsonStr bytes.Buffer
		_ = json.Indent(&jsonStr, jsonBytes, "", "  ")

		fmt.Println(jsonStr.String())
	}
}
