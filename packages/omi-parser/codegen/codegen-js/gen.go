package codegen_js

import (
	"strings"

	codegen_common "github.com/sheason2019/omi/omi-parser/codegen/codegen-common"
	tree_builder "github.com/sheason2019/omi/omi-parser/tree-builder"
)

func Gen(tree *tree_builder.TreeContext) string {
	ctx := codegen_common.CodegenContext{}

	genCommon(&ctx, tree)
	genServer(&ctx, tree)

	return strings.Join(ctx.RowContent, "\n")
}
