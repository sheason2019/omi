package file_dispatcher

import tree_builder "github.com/sheason2019/omi/omi-parser/tree-builder"

type FileDispatcher struct {
	PackageRoot   string
	DefaultMethod string

	FileStore     map[string]*FileContext
	FileUniqueMap map[string]string // file 的名称 - 路径Map，用来保证同一个上下文中生成的每个包名称都是不重复的
}

type FileContext struct {
	Content  string
	FileName string
	FilePath string

	// 生成的产物类型 common client server all
	Method string

	TreeContext *tree_builder.TreeContext

	// 生成的产物
	ProductCommon string
	ProductServer string
	ProductClient string
}

func New() *FileDispatcher {
	dispatcher := FileDispatcher{}
	dispatcher.FileStore = make(map[string]*FileContext)
	dispatcher.FileUniqueMap = make(map[string]string)
	return &dispatcher
}
