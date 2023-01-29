package codegen_go

import (
	"fmt"
	"strings"

	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
	tree_builder "github.com/sheason2019/omi/tree-builder"
	"github.com/sheason2019/omi/utils"
)

// 处理公共的代码生成
// 即Struct
func genCommon(ctx *file_dispatcher.FileContext, packageRoot string) string {
	tree := ctx.TreeContext

	row := []string{}

	importCtx := importContext{
		PackageRoot: packageRoot,
	}
	importCtx.UsedPackage = make(map[string]bool)
	importCtx.UsedDeps = map[string]bool{}

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
			str = str +
				utils.FirstLetterToUpper(variable.Identify.Content) + ` ` +
				variableRepeated(variable) +
				typeTrans(variable.TypeName.Content, &importCtx) +
				fmt.Sprintf(" `json:\"%s\" form:\"%s\"`\n", variable.Identify.Content, variable.Identify.Content)
		}
		str = str + "}\n"
		row = append(row, str)
	}

	if len(row) == 0 {
		return ""
	}

	row = append([]string{genImport(&importCtx)}, row...)

	row = append([]string{fmt.Sprintf("package %s\n", ctx.FileName)}, row...)

	return strings.Join(row, "\n")
}

func variableRepeated(variable *tree_builder.VariableDefine) string {
	if variable.Repeated != nil {
		return `[]`
	}
	return ``
}

func genImport(importCtx *importContext) string {
	if len(importCtx.UsedPackage) == 0 && len(importCtx.UsedDeps) == 0 {
		return ""
	}

	row := []string{}
	row = append(row, "import (")
	for pkgName := range importCtx.UsedPackage {
		if len(pkgName) > 0 {
			row = append(row, fmt.Sprintf("%s \"%s/%s\"", pkgName, importCtx.PackageRoot, pkgName))
		}
	}
	for dep := range importCtx.UsedDeps {
		if len(dep) > 0 {
			row = append(row, dep)
		}
	}

	row = append(row, ")")
	return strings.Join(row, "\n")
}
