package utils

import "strings"

func FirstLetterToUpper(source string) string {
	return strings.ToUpper(source[:1]) + source[1:]
}
