package tree_builder

import (
	"errors"

	"github.com/sheason2019/omi/common"
)

// 变量构建：
// 1. Decorator和Type声明阶段，这一阶段可以循环，直到用户输入Type为止
// 2. Identify声明
// 3. EndToken
func dealVariable(structDef *StructDefine, ts *TokenStream) *common.ErrorBlock {
	variableDef := VariableDefine{}
	for {
		block := variableTypeDeclare(&variableDef, ts)
		ts.NextUseful()
		if block != nil {
			return block
		}
		if variableDef.TypeName != nil {
			break
		}
	}

	identifyToken := ts.Read()
	if identifyToken == nil {
		return common.HandleErrorWithToken(errors.New("未完成的变量声明"), identifyToken)
	}
	for _, variable := range structDef.Variables {
		if variable.Identify.Content == identifyToken.Content {
			return common.HandleErrorWithToken(errors.New("重复的变量声明"), identifyToken)
		}
	}
	variableDef.Identify = identifyToken
	structDef.Variables = append(structDef.Variables, &variableDef)

	endToken := ts.NextUseful()
	return common.ShouldTokenContent(endToken, ";")
}

func variableTypeDeclare(variableDef *VariableDefine, ts *TokenStream) *common.ErrorBlock {
	token := ts.Read()
	if token == nil {
		return common.HandleErrorWithToken(errors.New("未完成的变量声明"), token)
	}

	if token.Content == "required" {
		if variableDef.Required != nil {
			return common.HandleErrorWithToken(errors.New("重复声明的修饰符"), token)
		}
		token.TokenType = "format"
		variableDef.Required = token
		return nil
	}
	if token.Content == "repeated" {
		if variableDef.Repeated != nil {
			return common.HandleErrorWithToken(errors.New("重复声明的修饰符"), token)
		}
		token.TokenType = "format"
		variableDef.Repeated = token
		return nil
	}
	token.TokenType = "struct"
	variableDef.TypeName = token
	return nil
}
