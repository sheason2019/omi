package codegen_go

import (
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
)

func Gen(ctx *file_dispatcher.FileContext, packageRoot string) {
	genTypeMap(ctx)

	if ctx.GenProductCommon {
		ctx.ProductCommon = genCommon(ctx, packageRoot)
	}
	if ctx.GenProductServer {
		ctx.ProductServer = genServer(ctx, packageRoot)
	}
	if ctx.GenProductClient {
		ctx.ProductClient = genClient(ctx, packageRoot)
	}
}
