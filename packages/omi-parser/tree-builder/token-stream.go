package tree_builder

import token_parser "github.com/sheason2019/omi/omi-parser/token-parser"

type TokenStream struct {
	ptr  uint
	list *[]token_parser.TokenStruct
}

func (tokenStream *TokenStream) Init(list *[]token_parser.TokenStruct) {
	tokenStream.ptr = 0
	tokenStream.list = list
}

func (tokenStream *TokenStream) Read() *token_parser.TokenStruct {
	if tokenStream.ptr >= uint(len(*tokenStream.list)) {
		return nil
	}
	return &(*tokenStream.list)[tokenStream.ptr]
}

func (tokenStream *TokenStream) Next() *token_parser.TokenStruct {
	if tokenStream.ptr < uint(len(*tokenStream.list)) {
		tokenStream.ptr = tokenStream.ptr + 1
	}
	if tokenStream.ptr > uint(len(*tokenStream.list)-1) {
		return nil
	}

	return &(*tokenStream.list)[tokenStream.ptr]
}

func (tokenStream *TokenStream) NextUseful() *token_parser.TokenStruct {
	token := tokenStream.Next()
	if token == nil {
		return token
	}

	if token.TokenType == "comment" {
		return tokenStream.NextUseful()
	}
	return token
}
