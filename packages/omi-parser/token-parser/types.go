package token_parser

type TokenStruct struct {
	// Token的起始行
	Line uint `json:"line"`
	// Token的起始列
	StartCharacter uint     `json:"startCharacter"`
	Length         uint     `json:"length"`
	TokenType      string   `json:"tokenType"`
	TokenModifiers []string `json:"tokenModifiers"`

	Content string
}

// 解析代码的上下文
type parseContext struct {
	// 引号状态 0表示不在引号状态 1表示正在使用单引号 2表示正在使用双引号
	QuoteMethod uint
	// 注释状态 0表示不在注释状态 1表示正在使用单行注释 2表示正在使用多行注释
	CommentMethod uint
}
