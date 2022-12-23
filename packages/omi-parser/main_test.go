package main_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"testing"

	codegen_js "github.com/sheason2019/omi/omi-parser/codegen/codegen-js"
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

var testList = []string{testContentA, testContentB}

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

func TestTokenGenerate(t *testing.T) {
	for _, content := range testList {
		tokens, _ := token_parser.Parse(content)
		tree_builder.Build(&tokens)

		jsonBytes, err := json.Marshal(tokens)
		if err != nil {
			panic(err)
		}

		var jsonStr bytes.Buffer
		_ = json.Indent(&jsonStr, jsonBytes, "", "  ")

		fmt.Println(jsonStr.String())
	}
}

func TestGenTS(t *testing.T) {
	tokens, _ := token_parser.Parse(testContentB)
	ctx := tree_builder.Build(&tokens)

	fmt.Println(codegen_js.Gen(ctx))
}

func TestStat(t *testing.T) {
	directory, err := os.Getwd()
	if err != nil {
		t.Error(err)
	}
	fmt.Println(directory)
}
