package file_dispatcher

import (
	"path"
	"regexp"

	tree_builder "github.com/sheason2019/omi/tree-builder"
)

const find_string = `\"(.*)\"`

// 解析语法树，获取其中的Import信息，并拉取依赖的文件进行解析
func (dispatcher *FileDispatcher) ParseTreeImport(tree *tree_builder.TreeContext, rootPath string) error {
	// 依赖的Map
	referenceMap := make(map[string]bool)
	for _, structDef := range tree.StructMap {
		if structDef.SourcePath != nil {
			refPath := structDef.SourcePath.Content
			compileString := regexp.MustCompile(find_string)
			refPath = compileString.FindStringSubmatch(refPath)[1]

			if !path.IsAbs(refPath) {
				refPath = path.Clean(rootPath + "/" + refPath)
			}
			referenceMap[refPath] = true
		}
	}

	// 使用Dispather去解析收集到的依赖文件
	for refPath := range referenceMap {
		// 因为Import只能导入其他文件定义的结构体，这里直接使用common减少产物代码的大小
		err := dispatcher.ParseFile(refPath, "common")
		if err != nil {
			return err
		}
	}

	return nil
}
