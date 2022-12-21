package token_parser

import (
	"strings"
)

func Parse(content string) ([]TokenStruct, error) {
	ctx := parseContext{}
	tokenList := make([]TokenStruct, 0)

	rows := strings.Split(content, "\n")
	for index, rowStr := range rows {
		tokenList = append(tokenList, tokenParser(ctx, rowStr, uint(index))...)
	}

	return tokenList, nil
}
