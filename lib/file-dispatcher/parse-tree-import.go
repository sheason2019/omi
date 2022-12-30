package file_dispatcher

import (
	"path"

	tree_builder "github.com/sheason2019/omi/tree-builder"
	"github.com/sheason2019/omi/utils"
)

// 解析语法树，获取其中的Import信息，并拉取依赖的文件进行解析
func (dispatcher *FileDispatcher) ParseTreeImport(tree *tree_builder.TreeContext, rootPath string) error {
	// 依赖的Map
	referenceMap := make(map[string]bool)
	for _, structDef := range tree.StructMap {
		if structDef.SourcePath != nil {
			refPath := utils.ParseString(structDef.SourcePath.Content)

			// 如果不是绝对路径，就将refPath转换为绝对路径
			if !path.IsAbs(refPath) {
				refPath = path.Clean(rootPath + "/" + refPath)
			}
			referenceMap[refPath] = true
		}
	}

	// 使用Dispather去解析收集到的依赖文件
	for refPath := range referenceMap {
		// 因为Import只能导入其他文件定义的结构体，这里直接使用common减少产物代码的大小
		fileCtx, err := dispatcher.ParseFile(refPath, "")
		if err != nil {
			return err
		}
		fileCtx.updateGenTargetByMethod("common")
	}

	return nil
}
