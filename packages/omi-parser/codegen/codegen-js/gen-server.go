package codegen_js

import (
	"fmt"

	codegen_common "github.com/sheason2019/omi/omi-parser/codegen/codegen-common"
	tree_builder "github.com/sheason2019/omi/omi-parser/tree-builder"
)

// 服务端根据Service中的值生成指定的接口文件
func genServer(ctx *codegen_common.CodegenContext, tree *tree_builder.TreeContext) {
	for _, service := range tree.ServiceMap {
		str := fmt.Sprintf("interface %s {", service.Identify.Content)
		for i, lambda := range service.Lambdas {
			if i == 0 {
				str = str + "\n"
			}
			str = str + lambda.Identify.Content + `(`
			if lambda.ArgType != nil {
				str = str + lambda.ArgName.Content + `: ` + typeTrans(lambda.ArgType.Content)
			}
			str = str + `)`
			str = str + `: ` + typeTrans(lambda.RtnType.Content) + ";\n"
		}
		str = str + `}`
		ctx.RowContent = append(ctx.RowContent, str)
	}
}
