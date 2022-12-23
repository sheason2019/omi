package tree_builder

import (
	"errors"

	"github.com/sheason2019/omi/omi-parser/common"
)

func dealService(ctx *TreeContext, ts *TokenStream) *common.ErrorBlock {
	serviceDef := ServiceDefine{}

	// 解析Identify
	identifyToken := ts.NextUseful()
	if identifyToken == nil {
		return common.HandleErrorWithToken(errors.New("缺少Service名称"), identifyToken)
	}

	identifyToken.TokenType = "struct"
	if ctx.DeclareMap[identifyToken.Content] {
		return common.HandleErrorWithToken(errors.New("该Service名称已存在"), identifyToken)
	}
	serviceDef.Identify = identifyToken
	ctx.ServiceMap[identifyToken.Content] = &serviceDef
	ctx.DeclareMap[identifyToken.Content] = true

	// 进入Service的上下文
	block := common.ShouldTokenContent(ts.NextUseful(), "{")
	if block != nil {
		return block
	}

	for {
		shouldLeave, errBlock := leaveServiceContext(ts)
		if errBlock != nil {
			return errBlock
		}
		if !shouldLeave {
			errBlock := dealLambda(&serviceDef, ts)
			if errBlock != nil {
				ctx.ErrorBlocks = append(ctx.ErrorBlocks, *errBlock)
				nextSyntax(ts)
			}
		} else {
			ts.NextUseful()
			break
		}
	}

	return nil
}

func leaveServiceContext(ts *TokenStream) (bool, *common.ErrorBlock) {
	token := ts.NextUseful()
	if token == nil {
		return true, common.HandleErrorWithToken(errors.New("Serivce上下文未关闭"), token)

	}

	return token.Content == "}", nil
}
