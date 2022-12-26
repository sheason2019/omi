package tree_builder

import (
	"errors"

	"github.com/sheason2019/omi/common"
)

func dealStruct(ctx *TreeContext, ts *TokenStream) *common.ErrorBlock {
	structDef := StructDefine{}

	identifyToken := ts.NextUseful()
	if identifyToken == nil {
		return common.HandleErrorWithToken(errors.New("缺少结构体名称"), identifyToken)
	}
	if ctx.DeclareMap[identifyToken.Content] {
		return common.HandleErrorWithToken(errors.New("结构体 "+identifyToken.Content+" 已存在"), identifyToken)
	}
	ctx.StructMap[identifyToken.Content] = &structDef
	ctx.DeclareMap[identifyToken.Content] = true
	structDef.Identify = identifyToken

	// 进入结构体定义上下文
	block := common.ShouldTokenContent(ts.NextUseful(), "{")
	if block != nil {
		return block
	}

	for {
		shouldLeave, errBlock := leaveStructContext(ts)
		if errBlock != nil {
			return errBlock
		}
		if !shouldLeave {
			block := dealVariable(&structDef, ts)
			if block != nil {
				ctx.ErrorBlocks = append(ctx.ErrorBlocks, *block)
				nextSyntax(ts)
			}
		} else {
			ts.NextUseful()
			break
		}
	}

	return nil
}

func leaveStructContext(ts *TokenStream) (bool, *common.ErrorBlock) {
	token := ts.NextUseful()
	if token == nil {
		return false, common.HandleErrorWithToken(errors.New("Struct上下文未关闭"), token)
	}

	return token.Content == "}", nil
}
