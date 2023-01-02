package file_dispatcher

import "errors"

func (dispatcher *FileDispatcher) GenFile(outDir string) error {
	if dispatcher.Lang == "ts" {
		return dispatcher.GenerateTypescript(outDir)
	} else if dispatcher.Lang == "go" {
		return dispatcher.GenerateGo(outDir)
	} else {
		return errors.New("暂不支持的语言类型:" + dispatcher.Lang)
	}
}
