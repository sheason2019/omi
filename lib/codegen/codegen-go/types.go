package codegen_go

type importContext struct {
	PackageRoot string

	UsedPackage map[string]bool
}

func (importCtx *importContext) AddPackage(packageName string) {
	importCtx.UsedPackage[packageName] = true
}
