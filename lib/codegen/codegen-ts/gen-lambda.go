package codegen_ts

import (
	"fmt"
	"strings"

	codegen_common "github.com/sheason2019/omi/codegen/codegen-common"
	tree_builder "github.com/sheason2019/omi/tree-builder"
)

func genLambda(lambda *tree_builder.LambdaDefine, service *tree_builder.ServiceDefine, importCtx *ImportContext) string {
	method, _ := codegen_common.GetMehod(lambda.Identify.Content)

	// Lambda的Identify
	str := lambda.Identify.Content
	// Lambda的参数，如果没有参数则直接写入一对括号
	if lambda.ArgType == nil {
		str = str + `() {` + "\n"
	} else {
		str = str + fmt.Sprintf("(%s: %s) {", lambda.ArgName.Content, lambda.ArgType.Content) + "\n"
		importCtx.AddStruct(lambda.ArgType.Content)
	}

	// Lambda的请求体，需要根据Method的不同写入不同的逻辑和参数
	lambdaPath := codegen_common.GenPath(service, lambda)
	if method == "Get" || method == "Delete" {
		str = str + "return this.ins." + strings.ToLower(method) +
			fmt.Sprintf("<%s>(this.host + \"%s\"", typeTrans(lambda.RtnType.Content), lambdaPath)
		importCtx.AddStruct(typeTrans(lambda.RtnType.Content))
		if lambda.ArgType == nil {
			str = str + `);`
		} else {
			str = str + fmt.Sprintf(", { params: %s });", lambda.ArgName.Content)
		}
	} else {
		str = str + "return this.ins." + strings.ToLower(method) +
			fmt.Sprintf("<%s>(this.host + \"%s\"", typeTrans(lambda.RtnType.Content), lambdaPath)
		importCtx.AddStruct(typeTrans(lambda.RtnType.Content))
		if lambda.ArgType == nil {
			str = str + `);`
		} else {
			str = str + fmt.Sprintf(", %s);", lambda.ArgName.Content)
		}
	}

	return str + "}\n"
}
