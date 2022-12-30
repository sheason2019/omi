package codegen_ts

import (
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
)

func Gen(ctx *file_dispatcher.FileContext) {
	tree := ctx.TreeContext

	if ctx.GenProductCommon {
		ctx.ProductCommon = genCommon(tree)
	}

	if ctx.GenProductServer {
		ctx.ProductServer = genServer(tree)
	}
	if ctx.GenProductClient {
		ctx.ProductClient = genClient(tree)
	}
}
