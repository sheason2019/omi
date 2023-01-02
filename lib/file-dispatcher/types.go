package file_dispatcher

import (
	token_parser "github.com/sheason2019/omi/token-parser"
	tree_builder "github.com/sheason2019/omi/tree-builder"
)

type FileDispatcher struct {
	ProjectRoot string
	// 标注产物的服务对象端，可选项有：client、server、all、common
	DefaultMethod string
	// 标注产物的语言类型
	Lang string

	FileStore     map[string]*FileContext
	FileUniqueMap map[string]string // file 的名称 - 路径Map，用来保证同一个上下文中生成的每个包名称都是不重复的
}

type FileContext struct {
	Content  string
	FileName string
	FilePath string

	// 生成的产物类型 common client server all
	GenProductCommon bool
	GenProductServer bool
	GenProductClient bool

	// 词法树的上下文
	TreeContext *tree_builder.TreeContext
	// TokenList的上下文
	TokenList *[]token_parser.TokenStruct

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
