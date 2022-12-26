package executable

import (
	"os"
	"path"

	"github.com/sheason2019/omi/checker"
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
	"github.com/sheason2019/omi/utils"
)

// 只能针对单一文件进行解析
func GenToken(filePath string) error {
	// 根据filepath获取内容
	// 然后调用file-dispatcher的ParseFile方法对文件进行解析，从而得到文件的Token信息，同时对不合理的导入值进行报错提示
	// 最终返回的值应当是一个JSON对象，其中包含Token信息、错误信息

	// 获取指定文件的绝对路径
	var absPath string
	if path.IsAbs(filePath) {
		absPath = filePath
	} else {
		currentDir, err := os.Getwd()
		if err != nil {
			return err
		}
		absPath = path.Clean(currentDir + "/" + filePath)
	}

	fileDispather := file_dispatcher.New()
	fileCtx, err := fileDispather.ParseFile(absPath)
	if err != nil {
		return err
	}

	// 导入检查器，校验TreeContext中的StructMap，根据包名从FileStore中拿到其他文件的TreeContext
	// 然后检查引用的Struct是否存在与指定文件的StructMap中
	err = checker.CheckImport(fileDispather, fileCtx)
	if err != nil {
		return err
	}

	// Token和错误信息
	utils.JsonLog(TokenOutput{
		TokenList:   *fileCtx.TokenList,
		ErrorBlocks: fileCtx.TreeContext.ErrorBlocks,
	})

	return nil
}
