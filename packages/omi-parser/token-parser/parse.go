/*
* 这个文件用来实现整体文本的解析
**/
package token_parser

import (
	"strings"
)

func Parse(content string) ([]TokenStruct, error) {
	ctx := parseContext{}
	ctx.Buf = []byte{}

	tokenList := make([]TokenStruct, 0)

	rows := strings.Split(content, "\n")
	for index, rowStr := range rows {
		tokenList = append(tokenList, rowParser(&ctx, rowStr, uint(index))...)
	}

	return tokenList, nil
}
