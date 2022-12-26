package utils

import "regexp"

const find_string = `\"(.*)\"`

// 从带有双引号的字符串中解析出实际内容
func ParseString(str string) string {
	compileString := regexp.MustCompile(find_string)
	str = compileString.FindStringSubmatch(str)[1]
	return str
}
