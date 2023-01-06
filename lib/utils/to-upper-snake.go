package utils

import "strings"

func ToUpperSnake(source string) string {
	data := make([]byte, 0)
	length := len(source)
	for i := 0; i < length; i++ {
		b := source[i]
		if i > 0 && b >= 'A' && b <= 'Z' {
			data = append(data, '_')
		}
		data = append(data, b)
	}

	return strings.ToUpper(string(data))
}
