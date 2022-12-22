package common

import (
	"strings"

	token_parser "github.com/sheason2019/omi/omi-parser/token-parser"
)

func HandleErrorWithToken(err error, token *token_parser.TokenStruct) *ErrorBlock {
	errBlock := ErrorBlock{}

	errBlock.Message = err.Error()
	if token == nil {
		errBlock.FromRow = 0
		errBlock.FromCol = 0
		errBlock.ToRow = 0
		errBlock.ToCol = 0
		return &errBlock
	}

	errBlock.FromRow = token.Line
	errBlock.FromCol = token.StartCharacter
	errBlock.Token = token

	tokenRows := strings.Split(token.Content, "\n")
	errBlock.ToRow = token.Line + uint(len(tokenRows)) - 1
	if errBlock.FromRow == errBlock.ToRow {
		errBlock.ToCol = errBlock.FromCol + token.Length
	} else {
		errBlock.ToCol = uint(len(tokenRows[len(tokenRows)-1]))
	}

	return &errBlock
}
