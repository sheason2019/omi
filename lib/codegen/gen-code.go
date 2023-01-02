package codegen

import (
	"errors"

	codegen_ts "github.com/sheason2019/omi/codegen/codegen-ts"
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
)

func GenCode(dispatcher *file_dispatcher.FileDispatcher, lang string) error {
	for _, fileCtx := range dispatcher.FileStore {
		if lang == "ts" {
			codegen_ts.Gen(fileCtx)
		} else {
			return errors.New("暂不支持的语言类型:" + lang)
		}
	}

	return nil
}
