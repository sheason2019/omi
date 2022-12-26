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
	// 是否正在创建字符串
	QuoteMethod bool

	// 字符缓冲区，用来写入Token
	Buf []byte
}
