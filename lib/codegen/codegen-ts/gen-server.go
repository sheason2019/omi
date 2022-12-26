package codegen_ts

import (
	"fmt"
	"strings"

	tree_builder "github.com/sheason2019/omi/tree-builder"
)

// 服务端根据Service中的值生成指定的接口文件
func genServer(tree *tree_builder.TreeContext) string {
	row := []string{}
	importCtx := ImportContext{}
	importCtx.UsedStruct = make(map[string]bool)

	// 下面这段循环逻辑中应当使用一个Map记录使用过的参数，然后使用genImport方法在row的前面追加导入语句
	for _, service := range tree.ServiceMap {
		// Typescript 使用 Enum 生成相关的Definition
		def := fmt.Sprintf("export enum %sDefinition {", service.Identify.Content)
		str := fmt.Sprintf("export interface %s {", service.Identify.Content)

		for i, lambda := range service.Lambdas {
			if i == 0 {
				str = str + "\n"
				def = def + "\n"
			}

			str = str + lambda.Identify.Content + `(`
			if lambda.ArgType != nil {
				str = str + lambda.ArgName.Content + `: ` + typeTrans(lambda.ArgType.Content)
				importCtx.AddStruct(lambda.ArgType.Content)
			}
			str = str + `)`
			str = str + `: ` + typeTrans(lambda.RtnType.Content) + ";\n"
			importCtx.AddStruct(lambda.RtnType.Content)

			lambdaPath := genPath(service, lambda)
			def = def + lambda.Identify.Content + "Path = \"" + lambdaPath + "\","
		}

		def = def + `}`
		str = str + `}`
		row = append(row, str)
		row = append(row, def)
	}

	row = append([]string{genImport(tree.StructMap, &importCtx)}, row...)

	return strings.Join(row, "\n")
}

func genPath(service *tree_builder.ServiceDefine, lambda *tree_builder.LambdaDefine) string {
	method, isfallback := getMehod(lambda.Identify.Content)
	var endpoint string
	if isfallback {
		endpoint = lambda.Identify.Content
	} else {
		endpoint = lambda.Identify.Content[len(method):]
	}
	return "/" + service.Identify.Content + "." + endpoint
}
