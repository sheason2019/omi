package tree_builder

import (
	"errors"

	"github.com/sheason2019/omi/omi-parser/common"
)

func dealLambda(svcDef *ServiceDefine, ts *TokenStream) *common.ErrorBlock {
	lambdaDef := LambdaDefine{}

	// 由于调用dealLambda之前经过了nil校验，所以这里Read到的指针必然不为nil
	rtnTypeToken := ts.Read()
	rtnTypeToken.TokenType = "struct"
	lambdaDef.RtnType = rtnTypeToken

	identifyToken := ts.NextUseful()
	if identifyToken == nil {
		return common.HandleErrorWithToken(errors.New("方法缺少名称"), identifyToken)
	}
	for _, lambda := range svcDef.Lambdas {
		if lambda.Identify.Content == identifyToken.Content {
			return common.HandleErrorWithToken(errors.New("方法名称重复"), identifyToken)
		}
	}
	lambdaDef.Identify = identifyToken
	identifyToken.TokenType = "function"
	svcDef.Lambdas = append(svcDef.Lambdas, &lambdaDef)

	// arg上下文起始符
	block := common.ShouldTokenContent(ts.NextUseful(), "(")
	if block != nil {
		return block
	}

	closeArg, block := shouldCloseLambdaArg(ts)
	if block != nil {
		return block
	}

	if !closeArg {
		argTypeToken := ts.Read()
		argTypeToken.TokenType = "struct"
		lambdaDef.ArgType = argTypeToken

		argNameToken := ts.NextUseful()
		if argNameToken == nil {
			return common.HandleErrorWithToken(errors.New("接口的参数缺少名称"), argNameToken)
		}
		lambdaDef.ArgName = argNameToken
		ts.NextUseful()
	}

	closeToken := ts.Read()
	block = common.ShouldTokenContent(closeToken, ")")
	if block != nil {
		return block
	}

	// Lambda声明终止符
	block = common.ShouldTokenContent(ts.NextUseful(), ";")
	if block != nil {
		return block
	}

	return nil
}

func shouldCloseLambdaArg(ts *TokenStream) (bool, *common.ErrorBlock) {
	token := ts.NextUseful()
	if token == nil {
		return true, common.HandleErrorWithToken(errors.New("缺少参数类型声明"), token)
	}
	return token.Content == ")", nil

}
