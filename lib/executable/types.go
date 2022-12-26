package executable

import (
	"github.com/sheason2019/omi/common"
	token_parser "github.com/sheason2019/omi/token-parser"
)

// 使用 Redux 的 Action Dispatch 风格来解决 Node 与 Go 之间的调用问题
type OutputContainer[T TokenOutput | CodeOutput | ErrorOutput] struct {
	Type    string
	Payload *T
}

type TokenOutput struct {
	TokenList   []token_parser.TokenStruct
	ErrorBlocks []common.ErrorBlock
}

type CodeOutput struct {
	// 所有受影响的文件的路径，将这个信息交给Node，方便Node调用Prittier格式化Typescript代码
	FilePaths []string

	Language string
}

type ErrorOutput struct {
	// 发生意外之外的错误时使用这个Output为Node调用端弹出错误
	Message string
}

func (op *TokenOutput) Pack() OutputContainer[TokenOutput] {
	return OutputContainer[TokenOutput]{
		Type:    "output/token",
		Payload: op,
	}
}

func (op *CodeOutput) Pack() OutputContainer[CodeOutput] {
	return OutputContainer[CodeOutput]{
		Type:    "output/code",
		Payload: op,
	}
}

func (op *ErrorOutput) Pack() OutputContainer[ErrorOutput] {
	return OutputContainer[ErrorOutput]{
		Type:    "output/error",
		Payload: op,
	}
}
