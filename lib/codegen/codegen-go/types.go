package codegen_go

type importContext struct {
	PackageRoot string

	UsedPackage map[string]bool
	UsedDeps    map[string]bool
}

func (importCtx *importContext) AddPackage(packageName string) {
	if len(packageName) > 0 {
		importCtx.UsedPackage[packageName] = true
	}
}
