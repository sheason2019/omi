package common

import token_parser "github.com/sheason2019/omi/omi-parser/token-parser"

type ErrorBlock struct {
	FromRow uint
	FromCol uint
	ToRow   uint
	ToCol   uint

	Message string
	Token   *token_parser.TokenStruct
}
