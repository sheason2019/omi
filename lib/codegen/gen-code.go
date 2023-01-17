package codegen

import (
	"errors"

	codegen_go "github.com/sheason2019/omi/codegen/codegen-go"
	codegen_ts "github.com/sheason2019/omi/codegen/codegen-ts"
	config_dispatcher "github.com/sheason2019/omi/config-dispatcher"
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
)

func GenCode(dispatcher *file_dispatcher.FileDispatcher, config *config_dispatcher.Config) error {
	for _, fileCtx := range dispatcher.FileStore {
		if config.Lang == "ts" {
			codegen_ts.Gen(fileCtx)
		} else if config.Lang == "go" {
			codegen_go.Gen(fileCtx, config.PackageRoot)
		} else {
			return errors.New("暂不支持的语言类型:" + config.Lang)
		}
	}

	return nil
}
