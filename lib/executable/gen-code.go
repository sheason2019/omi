package executable

import (
	"path"
	"strings"

	"github.com/sheason2019/omi/checker"
	codegen_ts "github.com/sheason2019/omi/codegen/codegen-ts"
	config_dispatcher "github.com/sheason2019/omi/config-dispatcher"
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
)

func GenCode(configPath string) error {
	configs, configPath, err := config_dispatcher.GetConfigs(configPath)
	if err != nil {
		panic(err)
	}

	// 拿到项目根目录的路径
	packageRoot := (configPath)[0:strings.LastIndex(configPath, "/")]

	// 根据配置文件解析出所有需要用到的语法树
	for _, config := range configs {
		dispatcher := file_dispatcher.New()
		dispatcher.PackageRoot = packageRoot
		dispatcher.DefaultMethod = config.Method
		// 通过Config完成对所有相关文件的解析
		err := dispatcher.ParseConfig(config)
		if err != nil {
			return err
		}
		// 解析后校验各个文件的导入是否有效
		for _, fileCtx := range dispatcher.FileStore {
			err := checker.CheckImport(dispatcher, fileCtx)
			if err != nil {
				return err
			}
		}

		for _, fileCtx := range dispatcher.FileStore {
			codegen_ts.Gen(fileCtx)
		}

		outDir := path.Clean(packageRoot + "/" + config.TargetDir)
		err = dispatcher.GenerateTypescript(outDir)
		if err != nil {
			return err
		}
	}

	return nil
}
