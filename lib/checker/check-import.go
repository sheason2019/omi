package checker

import (
	"errors"
	"path"
	"strings"

	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
	"github.com/sheason2019/omi/utils"
)

// 检查IDL文件中的引用是否合理
func CheckImport(dispatcher *file_dispatcher.FileDispatcher, fileCtx *file_dispatcher.FileContext) error {
	// 设置一个Map，用来存储FilePath - 结构体之间的对应关系
	importStructMap := make(map[string][]string)

	currentDir := fileCtx.FilePath[:strings.LastIndex(fileCtx.FilePath, "/")]
	// 遍历fileCtx中的StructMap，将导入的类型依次归类到上面定义的Map中
	for _, structDef := range fileCtx.TreeContext.StructMap {
		if structDef.SourcePath == nil {
			continue
		}

		// 获取filepath
		filePath := path.Clean(currentDir + "/" + utils.ParseString(structDef.SourcePath.Content))

		if importStructMap[filePath] == nil {
			importStructMap[filePath] = []string{}
		}

		// 将类型写入Map
		importStructMap[filePath] = append(importStructMap[filePath], structDef.Identify.Content)
	}

	// 从dispatcher中拉取相关的fileCtx，校验导入的内容是否有错误
	for filename, structDefs := range importStructMap {
		targetFileCtx := dispatcher.FileStore[filename]
		if targetFileCtx == nil {
			return errors.New("指定的包不存在：" + filename)
		}

		targetStructMap := targetFileCtx.TreeContext.StructMap
		for _, structDef := range structDefs {
			if targetStructMap[structDef] == nil {
				return errors.New("指定的类型不存在：" + structDef)
			}
			if targetStructMap[structDef].SourcePath != nil {
				return errors.New("必须从源文件引入结构体")
			}
		}
	}

	return nil
}
