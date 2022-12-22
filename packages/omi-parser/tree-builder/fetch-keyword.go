package tree_builder

import (
	"errors"

	token_parser "github.com/sheason2019/omi/omi-parser/token-parser"
	"github.com/sheason2019/omi/omi-parser/utils"
)

var allowKeyword = []string{"import", "struct", "service"}

// 寻找解析关键字
func fetchKeyword(token *token_parser.TokenStruct) (string, error) {
	if utils.Exist(allowKeyword, token.Content) {
		token.TokenType = "keyword"
		return token.Content, nil
	}

	return "", errors.New("未定义的关键字:" + token.Content)
}
