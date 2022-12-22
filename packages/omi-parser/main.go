package main

import (
	"fmt"

	token_parser "github.com/sheason2019/omi/omi-parser/token-parser"
)

const testContent = `
import { Todo, TodoType } from "./todo.omi";

service Import {
  repeated Todo GetTodo(int id);
  TodoType GetTodoType();
}
`

func main() {
	tokens, _ := token_parser.Parse(testContent)

	for _, token := range tokens {
		fmt.Printf("%+v\n", token)
	}
}
