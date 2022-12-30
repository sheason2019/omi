package codegen_go

import (
	"fmt"
	"strings"

	tree_builder "github.com/sheason2019/omi/tree-builder"
)

func genServer(tree *tree_builder.TreeContext, packageRoot string) string {
	row := []string{}
	importCtx := importContext{
		PackageRoot: packageRoot,
	}
	importCtx.UsedPackage = make(map[string]bool)

	for _, service := range tree.ServiceMap {
		str := fmt.Sprintf("type %s interface {", service.Identify.Content)
		for _, lambda := range service.Lambdas {
			str = str + genServerLambda(lambda, &importCtx)
		}
		str = str + `}`

		row = append(row, str)
	}

	row = append([]string{genImport(&importCtx)}, row...)

	return strings.Join(row, "\n")
}

func genServerLambda(lambda *tree_builder.LambdaDefine, importCtx *importContext) string {
	str := fmt.Sprintf("%s(", lambda.Identify.Content)
	if lambda.ArgType != nil {
		str = str + fmt.Sprintf("%s %s", lambda.ArgName.Content, typeTrans(lambda.ArgType.Content, importCtx))
	}
	str = str + `)`

	rtnType := typeTrans(lambda.RtnType.Content, importCtx)
	if len(rtnType) > 0 {
		str = str + ` ` + rtnType
	}

	return str
}
