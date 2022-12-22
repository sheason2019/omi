package token_parser

var spaceChar = []byte{' ', '\n'}

var signalChar = []byte{'(', ')', '{', '}', ';', '?', '/'}

var quoteChar = []byte{'\'', '"'}

func rowParser(ctx parseContext, rowStr string, rowIndex uint) []TokenStruct {
	tokens := []TokenStruct{}

	buf := []byte{}
	for i := 0; i < len(rowStr); i++ {
		char := rowStr[i]
		check := checkByte(char)
		// 为0时需要将字符写入buf
		if check == 0 {
			buf = append(buf, char)
		}
		// 为1时表示遇到了空格或换行符，需要将buf中的字符串写入Token
		if check == 1 {
			token := flushBuf(&buf, rowIndex, i)
			if token != nil {
				tokens = append(tokens, *token)
			}
		}
		// 为2时表示遇到了符号，除了将当前的buf写入Token以外，还需要将符号也一并写入Token
		if check == 2 {
			token := flushBuf(&buf, rowIndex, i)
			if token != nil {
				tokens = append(tokens, *token)
			}
			buf = append(buf, char)
			token = flushBuf(&buf, rowIndex, i+1)
			if token != nil {
				tokens = append(tokens, *token)
			}
			if char == '/' {
				if checkCommentStart(tokens) {
					generateCommentToken(&tokens, rowStr, rowIndex, uint(i-1))
					break
				}
			}
		}
		// check值为3时表示遇到了引号，此时除了将buf写入Token外，还需要在上下文中添加相关的信息
		if check == 3 {
			token := flushBuf(&buf, rowIndex, i)
			if token != nil {
				tokens = append(tokens, *token)
			}
			buf = append(buf, char)
			token = flushBuf(&buf, rowIndex, i+1)
			if token != nil {
				tokens = append(tokens, *token)
			}
		}
	}

	token := flushBuf(&buf, rowIndex, len(rowStr))
	if token != nil {
		tokens = append(tokens, *token)
	}

	return tokens
}

func flushBuf(buf *[]byte, line uint, col int) *TokenStruct {
	if len(*buf) != 0 {
		content := string(*buf)
		token := TokenStruct{
			Line:           line,
			StartCharacter: uint(col - len(content)),
			Length:         uint(len(content)),
			Content:        content,
			TokenType:      "",
			TokenModifiers: nil,
		}
		*buf = []byte{}
		return &token
	}
	return nil
}

// 检查当前byte是否应该被分割
func checkByte(char byte) int {
	for _, b := range spaceChar {
		if b == char {
			return 1
		}
	}
	for _, b := range signalChar {
		if b == char {
			return 2
		}
	}
	for _, b := range quoteChar {
		if b == char {
			return 3
		}
	}
	return 0
}

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
