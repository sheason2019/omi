package codegen_ts

import (
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
)

func Gen(ctx *file_dispatcher.FileContext) {
	tree := ctx.TreeContext

	ctx.ProductCommon = genCommon(tree)

	if ctx.Method == "server" || ctx.Method == "all" {
		ctx.ProductServer = genServer(tree)
	}
	if ctx.Method == "client" || ctx.Method == "all" {
		ctx.ProductClient = genClient(tree)
	}
}
