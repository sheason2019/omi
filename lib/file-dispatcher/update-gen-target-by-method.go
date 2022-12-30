package file_dispatcher

func (ctx *FileContext) updateGenTargetByMethod(method string) {
	if method == "server" {
		ctx.GenProductCommon = true
		ctx.GenProductServer = true
	} else if method == "client" {
		ctx.GenProductCommon = true
		ctx.GenProductClient = true
	} else if method == "common" {
		ctx.GenProductCommon = true
	} else if method == "all" {
		ctx.GenProductClient = true
		ctx.GenProductCommon = true
		ctx.GenProductServer = true
	}
}
