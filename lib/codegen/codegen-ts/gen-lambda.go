package codegen_ts

import (
	"fmt"
	"strings"

	tree_builder "github.com/sheason2019/omi/tree-builder"
)

func genLambda(lambda *tree_builder.LambdaDefine, service *tree_builder.ServiceDefine, importCtx *ImportContext) string {
	method, _ := getMehod(lambda.Identify.Content)

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
	lambdaPath := genPath(service, lambda)
	if method == "Get" || method == "Delete" {
		str = str + "return this.ins." + strings.ToLower(method) +
			fmt.Sprintf("<%s>(this.host + \"%s\"", lambda.RtnType.Content, lambdaPath)
		importCtx.AddStruct(lambda.RtnType.Content)
		if lambda.ArgType == nil {
			str = str + `);`
		} else {
			str = str + fmt.Sprintf(", { params: %s });", lambda.ArgName.Content)
		}
	} else {
		str = str + "return this.ins." + strings.ToLower(method) +
			fmt.Sprintf("<%s>(this.host + \"%s\"", lambda.RtnType.Content, lambdaPath)
		importCtx.AddStruct(lambda.RtnType.Content)
		if lambda.ArgType == nil {
			str = str + `);`
		} else {
			str = str + fmt.Sprintf(", %s);", lambda.ArgName.Content)
		}
	}

	return str + "}\n"
}

// 当Identify与所有的Method都不匹配时（如Login、Regist等），getMethod默认返回Post
// getMethod函数使用第二个布尔类型的返回值来标记Method是严格匹配还是默认匹配
func getMehod(identify string) (string, bool) {
	methods := []string{"Get", "Post", "Put", "Delete", "Patch"}
	for _, method := range methods {
		if strings.Index(identify, method) == 0 {
			return method, false
		}
	}
	return "Post", true
}
