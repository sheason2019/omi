package main

import (
	"bytes"
	"encoding/json"
	"fmt"

	token_parser "github.com/sheason2019/omi/omi-parser/token-parser"
	tree_builder "github.com/sheason2019/omi/omi-parser/tree-builder"
)

const testContent = `
import { Todo, TodoType } from "./todo.omi";

service Import {
  Todo GetTodo(int id);
  TodoType GetTodoType();
}
`

func main() {
	tokens, _ := token_parser.Parse(testContent)
	ctx := tree_builder.Build(&tokens)

	jsonBytes, err := json.Marshal(ctx)
	if err != nil {
		panic(err)
	}

	var jsonStr bytes.Buffer
	_ = json.Indent(&jsonStr, jsonBytes, "", "  ")

	fmt.Println(jsonStr.String())
}
