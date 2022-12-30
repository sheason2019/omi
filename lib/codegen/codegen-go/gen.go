package codegen_go

import (
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
)

func Gen(ctx *file_dispatcher.FileContext, packageRoot string) {
	genTypeMap(ctx)

	tree := ctx.TreeContext

	if ctx.GenProductCommon {
		ctx.ProductCommon = genCommon(tree, packageRoot)
	}

	if ctx.GenProductServer {
		ctx.ProductServer = genServer(tree, packageRoot)
	}
	if ctx.GenProductClient {
		ctx.ProductClient = genClient(tree, packageRoot)
	}
}
