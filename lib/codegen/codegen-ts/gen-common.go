package codegen_ts

import (
	"strings"

	tree_builder "github.com/sheason2019/omi/tree-builder"
)

// 处理公共的代码生成
// 即Struct
func genCommon(tree *tree_builder.TreeContext) string {
	row := []string{}
	importCtx := ImportContext{}
	importCtx.SkipLocal = true
	importCtx.UsedStruct = make(map[string]bool)

	for _, item := range tree.StructMap {
		// 这里的循环逻辑主要用来生成本地定义的结构体，因此要略过导入的结构体
		if item.SourcePath != nil {
			continue
		}

		str := `export interface ` + item.Identify.Content + ` {`
		for i, variable := range item.Variables {
			if i == 0 {
				str = str + "\n"
			}
			str = str + variable.Identify.Content
			if variable.Required == nil {
				str = str + "?"
			}
			str = str + `: ` + typeTrans(variable.TypeName.Content)
			importCtx.AddStruct(variable.TypeName.Content)
			if variable.Repeated != nil {
				str = str + `[]`
			}
			str = str + ";\n"
		}
		str = str + "}\n"
		row = append(row, str)
	}

	if len(row) == 0 {
		return ""
	}

	row = append([]string{genImport(tree.StructMap, &importCtx)}, row...)

	return strings.Join(row, "\n")
}
