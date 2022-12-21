package token_parser

var spaceChar = []byte{' ', '\n'}

var signalChar = []byte{'(', ')', '{', '}', ';', ',', '?'}

var quoteChar = []byte{'\'', '"'}

func tokenParser(ctx parseContext, rowStr string, rowIndex uint) []TokenStruct {
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
