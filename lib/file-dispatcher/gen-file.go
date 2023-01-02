package file_dispatcher

import "errors"

func (dispatcher *FileDispatcher) GenFile(outDir string) error {
	if dispatcher.Lang == "ts" {
		err := dispatcher.GenerateTypescript(outDir)
		if err != nil {
			return err
		}
	} else {
		return errors.New("暂不支持的语言类型:" + dispatcher.Lang)
	}

	return nil
}
