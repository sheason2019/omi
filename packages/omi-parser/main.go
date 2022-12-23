package main

import (
	"path"
	"strings"

	codegen_ts "github.com/sheason2019/omi/omi-parser/codegen/codegen-ts"
	config_dispatcher "github.com/sheason2019/omi/omi-parser/config-dispatcher"
	file_dispatcher "github.com/sheason2019/omi/omi-parser/file-dispatcher"
)

func main() {
	configFilePath := ""
	configs, configFilePath, err := config_dispatcher.GetConfigs(configFilePath)
	if err != nil {
		panic(err)
	}

	// 拿到项目根目录的路径
	packageRoot := (configFilePath)[0:strings.LastIndex(configFilePath, "/")]
	dispatcher := file_dispatcher.New()

	// 根据配置文件解析出所有需要用到的语法树
	for _, config := range configs {
		dispatcher.PackageRoot = packageRoot
		dispatcher.DefaultMethod = config.Method
		err := dispatcher.ParseConfig(config)
		if err != nil {
			panic(err)
		}

		for _, fileCtx := range dispatcher.FileStore {
			codegen_ts.Gen(fileCtx)
		}

		outDir := path.Clean(packageRoot + "/" + config.TargetDir)
		err = dispatcher.GenerateTypescript(outDir)
		if err != nil {
			panic(err)
		}
	}

}
