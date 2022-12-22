package common

import (
	"errors"

	token_parser "github.com/sheason2019/omi/omi-parser/token-parser"
)

func ShouldTokenContent(token *token_parser.TokenStruct, content string) *ErrorBlock {
	if token == nil {
		return HandleErrorWithToken(errors.New("缺少 '"+content+"'"), token)
	}
	if token.Content != content {
		return HandleErrorWithToken(errors.New("应当为 '"+content+"'"), token)
	}
	return nil
}
