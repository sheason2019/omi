package tree_builder

import (
	"errors"

	"github.com/sheason2019/omi/omi-parser/common"
)

// 处理 import 语句
func dealImport(ctx *TreeContext, tokenStream *TokenStream) *common.ErrorBlock {
	block := common.ShouldTokenContent(tokenStream.NextUseful(), "{")
	if block != nil {
		return block
	}

	structs := []*StructDefine{}

	for {
		identifyToken := tokenStream.NextUseful()
		if identifyToken == nil {
			return common.HandleErrorWithToken(errors.New("无法获取类型名称"), identifyToken)
		}

		identifyToken.TokenType = "struct"
		structDef := StructDefine{}
		structDef.Identify = identifyToken
		if ctx.StructMap[identifyToken.Content] != nil {
			return common.HandleErrorWithToken(errors.New("类型已存在"), identifyToken)
		} else {
			ctx.StructMap[identifyToken.Content] = &structDef
			structs = append(structs, &structDef)
		}

		splitToken := tokenStream.NextUseful()
		if splitToken == nil {
			return common.HandleErrorWithToken(errors.New("import 上下文未闭合"), splitToken)
		}
		if splitToken.Content != "," && splitToken.Content != "}" {
			return common.HandleErrorWithToken(errors.New("此处应当是 ',' 或 '}'"), splitToken)
		}
		if splitToken.Content == "}" {
			break
		}
	}

	fromToken := tokenStream.NextUseful()
	block = common.ShouldTokenContent(fromToken, "from")
	if block != nil {
		return block
	}
	fromToken.TokenType = "keyword"

	pathToken := tokenStream.NextUseful()
	if pathToken == nil {
		return common.HandleErrorWithToken(errors.New("必须指定导入文件的位置"), pathToken)
	}
	if pathToken.TokenType != "string" {
		return common.HandleErrorWithToken(errors.New("导入文件的值必须是字符串"), pathToken)
	}
	// 调整结构体的SourcePath指向
	for _, structDef := range structs {
		structDef.SourcePath = pathToken
	}

	block = common.ShouldTokenContent(tokenStream.NextUseful(), ";")
	tokenStream.NextUseful()
	return block
}
