package codegen_js

import (
	codegen_common "github.com/sheason2019/omi/omi-parser/codegen/codegen-common"
	tree_builder "github.com/sheason2019/omi/omi-parser/tree-builder"
)

// 处理公共的代码生成
// 即Struct
func genCommon(ctx *codegen_common.CodegenContext, tree *tree_builder.TreeContext) {
	for _, item := range tree.StructMap {
		// 先不处理import的变量
		if item.SourcePath != nil {
			continue
		}

		str := `interface ` + item.Identify.Content + ` {`
		for i, variable := range item.Variables {
			if i == 0 {
				str = str + "\n"
			}
			str = str + variable.Identify.Content
			if variable.Required == nil {
				str = str + "?"
			}
			str = str + `: ` + typeTrans(variable.TypeName.Content)
			if variable.Repeated != nil {
				str = str + `[]`
			}
			str = str + ";\n"
		}
		str = str + "}\n"
		ctx.RowContent = append(ctx.RowContent, str)
	}
}
