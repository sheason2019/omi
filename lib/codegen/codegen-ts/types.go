package codegen_ts

type ImportContext struct {
	UsedStruct map[string]bool
	UseAxios   bool
	SkipLocal  bool
}

func (importCtx *ImportContext) AddStruct(structName string) {
	importCtx.UsedStruct[structName] = true
}
