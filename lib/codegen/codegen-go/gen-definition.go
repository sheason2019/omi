package codegen_go

import (
	"fmt"
	"strings"

	codegen_common "github.com/sheason2019/omi/codegen/codegen-common"
	tree_builder "github.com/sheason2019/omi/tree-builder"
)

func genDefinition(service *tree_builder.ServiceDefine) string {
	row := []string{}
	defName := "_" + strings.ToLower(service.Identify.Content[:1]) + service.Identify.Content[1:] + "Definition"

	// 使用Map收集路径定义信息并去重
	pathMap := make(map[string]string)
	for _, lambda := range service.Lambdas {
		lambdaPath := codegen_common.GenPath(service, lambda)
		pathName := codegen_common.GenPathName(lambda)

		if _, exist := pathMap[pathName]; !exist {
			pathMap[pathName] = lambdaPath
		}
	}

	// 这里新建两个array把时间复杂度控制到o(n)，但是可能会牺牲一点代码可读性
	structRow := []string{}
	variableRow := []string{}

	for pathName, lambdaPath := range pathMap {
		structRow = append(structRow, fmt.Sprintf("%s string", pathName))
		variableRow = append(variableRow, fmt.Sprintf("%s: \"%s\",", pathName, lambdaPath))
	}

	row = append(row, fmt.Sprintf("type %s struct {", defName))
	row = append(row, strings.Join(structRow, "\n"))
	row = append(row, "}")

	row = append(row, fmt.Sprintf("var %s = %s{", service.Identify.Content+"Definition", defName))
	row = append(row, strings.Join(variableRow, "\n"))
	row = append(row, "}")

	return strings.Join(row, "\n")
}
