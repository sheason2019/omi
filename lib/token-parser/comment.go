package token_parser

// 检查是否开始使用注释
func checkCommentStart(tokens []TokenStruct) bool {
	if len(tokens) < 2 {
		return false
	}
	tokenA := tokens[len(tokens)-1]
	tokenB := tokens[len(tokens)-2]

	// 如果发现正在使用注释，则返回true
	if tokenA.Content == "/" && tokenB.Content == "/" {
		return true
	}

	return false
}

// 如果发现正在使用注释，则需要生成注释Token并对TokenList包含的内容进行处理
func generateCommentToken(tokens *[]TokenStruct, rowStr string, line uint, startIndex uint) {
	tokenArr := *tokens
	// 首先截断CommentStart Token，生成一个新的切片
	tokenArr = tokenArr[:len(tokenArr)-2]
	// 然后获取注释内容
	commentContent := rowStr[startIndex:]
	commentToken := TokenStruct{
		Line:           line,
		StartCharacter: startIndex,
		Length:         uint(len(commentContent)),
		TokenType:      "comment",
		TokenModifiers: nil,

		Content: commentContent,
	}
	tokenArr = append(tokenArr, commentToken)
	*tokens = tokenArr
}
