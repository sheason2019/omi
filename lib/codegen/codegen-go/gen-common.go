package codegen_go

import (
	"fmt"
	"strings"

	tree_builder "github.com/sheason2019/omi/tree-builder"
)

// 处理公共的代码生成
// 即Struct
func genCommon(tree *tree_builder.TreeContext, packageRoot string) string {
	row := []string{}
	importCtx := importContext{
		PackageRoot: packageRoot,
	}
	importCtx.UsedPackage = make(map[string]bool)

	for _, item := range tree.StructMap {
		// 这里的循环逻辑主要用来生成本地定义的结构体，因此要略过导入的结构体
		if item.SourcePath != nil {
			continue
		}

		str := `type ` + item.Identify.Content + ` struct {`
		for i, variable := range item.Variables {
			if i == 0 {
				str = str + "\n"
			}
			str = str + variable.Identify.Content + ` ` + variableRepeated(variable) + typeTrans(variable.TypeName.Content, &importCtx)
		}
		str = str + "}\n"
		row = append(row, str)
	}

	row = append([]string{genImport(&importCtx)}, row...)

	return strings.Join(row, "\n")
}

func variableRepeated(variable *tree_builder.VariableDefine) string {
	if variable.Repeated != nil {
		return `[]`
	}
	return ``
}

func genImport(importCtx *importContext) string {
	row := []string{}
	row = append(row, "import (")
	for pkgName := range importCtx.UsedPackage {
		if len(pkgName) > 0 {
			row = append(row, fmt.Sprintf("%s \"%s/%s\"", pkgName, importCtx.PackageRoot, pkgName))
		}
	}
	row = append(row, ")")
	return strings.Join(row, "\n")
}
