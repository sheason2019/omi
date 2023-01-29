package codegen_common

import (
	"strings"

	tree_builder "github.com/sheason2019/omi/tree-builder"
	"github.com/sheason2019/omi/utils"
)

func GenPath(service *tree_builder.ServiceDefine, lambda *tree_builder.LambdaDefine) string {
	method, isfallback := GetMehod(lambda.Identify.Content)
	var endpoint string
	if isfallback {
		endpoint = lambda.Identify.Content
	} else {
		endpoint = lambda.Identify.Content[len(method):]
	}
	return "/" + service.Identify.Content + "." + endpoint
}

func GenPathName(lambda *tree_builder.LambdaDefine) string {
	return utils.ToUpperSnake(lambda.Identify.Content) + "_PATH"
}

// 当Identify与所有的Method都不匹配时（如Login、Regist等），getMethod默认返回Post
// getMethod函数使用第二个布尔类型的返回值来标记Method是严格匹配还是默认匹配
func GetMehod(identify string) (string, bool) {
	methods := []string{"Get", "Post", "Put", "Delete", "Patch"}
	for _, method := range methods {
		if strings.Index(identify, method) == 0 {
			return method, false
		}
	}
	return "Post", true
}
