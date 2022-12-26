package codegen_ts

import (
	"fmt"
	"path"
	"strings"

	tree_builder "github.com/sheason2019/omi/tree-builder"
)

func genImport(treeStructMap map[string]*tree_builder.StructDefine, importCtx *ImportContext) string {
	row := []string{}
	skipLocal := importCtx.SkipLocal

	structMap := make(map[string][]string)
	for _, structDef := range treeStructMap {
		// 根据使用情况剪枝
		if !importCtx.UsedStruct[structDef.Identify.Content] {
			continue
		}

		sourcePack := "."
		if structDef.SourcePath != nil {
			sourcePack = path.Base(structDef.SourcePath.Content)
			sourcePack = `../` + sourcePack[:strings.LastIndex(sourcePack, ".")]
		} else {
			if skipLocal {
				continue
			}
		}
		if structMap[sourcePack] == nil {
			structMap[sourcePack] = []string{}
		}
		structMap[sourcePack] = append(structMap[sourcePack], structDef.Identify.Content)
	}
	for source, list := range structMap {
		str := fmt.Sprintf("import { %s } from \"%s\";", strings.Join(list, ", "), source)
		row = append(row, str)
	}

	if importCtx.UseAxios {
		row = append([]string{`import axios, { AxiosInstance } from "axios";`}, row...)
	}

	return strings.Join(row, "\n") + "\n"
}
