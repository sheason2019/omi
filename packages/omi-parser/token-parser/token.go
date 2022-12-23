/*
* 这个文件主要用来实现Token的分割
**/
package token_parser

import "github.com/sheason2019/omi/omi-parser/utils"

var spaceChar = []byte{' ', '\n'}

var signalChar = []byte{'(', ')', '{', '}', ';', '?', '/', ','}

var quoteChar = []byte{'\'', '"'}

func rowParser(ctx *parseContext, rowStr string, rowIndex uint) []TokenStruct {
	tokens := []TokenStruct{}

	buf := &ctx.Buf
	for i := 0; i < len(rowStr); i++ {
		char := rowStr[i]
		// 字符串循环
		if ctx.QuoteMethod {
			*buf = append(*buf, char)
			if char == '"' {
				ctx.QuoteMethod = false
			}
			if !ctx.QuoteMethod {
				flushBuf(buf, rowIndex, i, &tokens)
				tokens[len(tokens)-1].TokenType = "string"
			}
			continue
		}

		// 遇到了空格或换行符时，需要将buf中的字符串写入Token
		if utils.Exist(spaceChar, char) {
			flushBuf(buf, rowIndex, i, &tokens)
			continue
		}
		// 遇到了符号时，除了将当前的buf写入Token以外，还需要将符号也一并写入Token
		if utils.Exist(signalChar, char) {
			flushBuf(buf, rowIndex, i, &tokens)
			*buf = append(*buf, char)
			flushBuf(buf, rowIndex, i+1, &tokens)
			if char == '/' {
				if checkCommentStart(tokens) {
					generateCommentToken(&tokens, rowStr, rowIndex, uint(i-1))
					break
				}
			}
			continue
		}
		// 遇到了引号时，除了将buf写入Token外，还需要在上下文中添加相关的信息，字符串标注仅能使用双引号
		if utils.Exist(quoteChar, char) {
			flushBuf(buf, rowIndex, i, &tokens)
			*buf = append(*buf, char)
			if char == '\'' {
				// 使用单引号是错误的行为，之后会在这里标注错误信息
				flushBuf(buf, rowIndex, i+1, &tokens)
			} else {
				// 进入字符串模式
				ctx.QuoteMethod = true
			}
			continue
		}

		*buf = append(*buf, char)
	}

	flushBuf(buf, rowIndex, len(rowStr), &tokens)
	if ctx.QuoteMethod {
		tokens[len(tokens)-1].TokenType = "string"
	}

	return tokens
}

func flushBuf(buf *[]byte, line uint, col int, tokens *[]TokenStruct) {
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
		*tokens = append(*tokens, token)
	}
}
