package tree_builder

import (
	"github.com/sheason2019/omi/common"
	token_parser "github.com/sheason2019/omi/token-parser"
)

type TreeContext struct {
	ErrorBlocks []common.ErrorBlock
	StructMap   map[string]*StructDefine
	ServiceMap  map[string]*ServiceDefine
	DeclareMap  map[string]bool
}

type StructDefine struct {
	Identify  *token_parser.TokenStruct
	Variables []*VariableDefine

	// 这个字段用来标注结构体引用自何处，如果为nil，则表示结构体是当前文件定义的
	SourcePath *token_parser.TokenStruct
}

type ServiceDefine struct {
	Identify *token_parser.TokenStruct
	Lambdas  []*LambdaDefine
}

type VariableDefine struct {
	Identify *token_parser.TokenStruct
	Required *token_parser.TokenStruct
	Repeated *token_parser.TokenStruct
	TypeName *token_parser.TokenStruct
}

// 当Lambda的参数为空时，ArgType的值为void
type LambdaDefine struct {
	Identify *token_parser.TokenStruct
	ArgType  *token_parser.TokenStruct
	ArgName  *token_parser.TokenStruct
	RtnType  *token_parser.TokenStruct
}
