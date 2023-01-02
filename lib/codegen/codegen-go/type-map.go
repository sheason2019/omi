package codegen_go

import (
	"path"
	"strings"

	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
)

type typeStruct struct {
	Typename    string
	PackageName string
}

var typeMap map[string]*typeStruct

// 生成类型Map
func genTypeMap(fileCtx *file_dispatcher.FileContext) {
	typeMap = make(map[string]*typeStruct)
	// 基本类型
	typeMap["float"] = &typeStruct{
		Typename:    "float32",
		PackageName: "",
	}
	typeMap["double"] = &typeStruct{
		Typename:    "int64",
		PackageName: "",
	}
	typeMap["void"] = &typeStruct{
		Typename:    "",
		PackageName: "",
	}
	typeMap["boolean"] = &typeStruct{
		Typename:    "bool",
		PackageName: "",
	}
	// 引入类型
	for _, structDef := range fileCtx.TreeContext.StructMap {
		if structDef.SourcePath != nil {
			sourcePack := path.Base(structDef.SourcePath.Content)
			sourcePack = sourcePack[:strings.LastIndex(sourcePack, ".")]
			typeMap[structDef.Identify.Content] = &typeStruct{
				Typename:    sourcePack + `.` + structDef.Identify.Content,
				PackageName: sourcePack,
			}
		}
	}
}

func typeTrans(origin string, importCtx *importContext) string {
	if v, exist := typeMap[origin]; exist {
		if len(v.PackageName) > 0 {
			importCtx.AddPackage(v.PackageName)
		}
		return v.Typename
	}
	return origin
}
