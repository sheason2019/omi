package codegen_ts

import (
	"fmt"
	"path"
	"strings"

	tree_builder "github.com/sheason2019/omi/omi-parser/tree-builder"
)

func genImport(treeStructMap map[string]*tree_builder.StructDefine, row *[]string, skipLocal bool) {
	structMap := make(map[string][]string)
	for _, structDef := range treeStructMap {
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
		*row = append(*row, str)
	}
}
