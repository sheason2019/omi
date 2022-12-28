package logger

import "fmt"

type Logger struct {
	Hidden bool
}

func (logger *Logger) Log(str string) {
	if !logger.Hidden {
		fmt.Println(str)
	}
}
