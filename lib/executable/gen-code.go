package executable

import (
	"fmt"
	"os/exec"
	"path"
	"strings"
	"sync"

	"github.com/sheason2019/omi/checker"
	codegen_ts "github.com/sheason2019/omi/codegen/codegen-ts"
	config_dispatcher "github.com/sheason2019/omi/config-dispatcher"
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
	"github.com/sheason2019/omi/logger"
)

func GenCode(configPath string, showLog bool) error {
	logger := logger.Logger{
		Hidden: !showLog,
	}
	logger.Log("正在获取配置文件")
	configs, configPath, err := config_dispatcher.GetConfigs(configPath)
	if err != nil {
		panic(err)
	}
	logger.Log("获取配置文件成功：" + configPath)

	// 拿到项目根目录的路径
	packageRoot := (configPath)[0:strings.LastIndex(configPath, "/")]

	logger.Log(fmt.Sprintf("配置文件包含的配置项个数：%d", len(configs)))

	wg := sync.WaitGroup{}
	// 根据配置文件解析出所有需要用到的语法树
	for index, config := range configs {
		dispatcher := file_dispatcher.New()
		dispatcher.PackageRoot = packageRoot
		dispatcher.DefaultMethod = config.Method
		// 通过Config完成对所有相关文件的解析
		logger.Log(fmt.Sprintf("[%d/%d]正在生成接口信息", index+1, len(configs)))
		err := dispatcher.ParseConfig(config)
		if err != nil {
			return err
		}
		// 解析后校验各个文件的导入是否有效
		logger.Log(fmt.Sprintf("[%d/%d]正在检查生成内容", index+1, len(configs)))
		for _, fileCtx := range dispatcher.FileStore {
			err := checker.CheckImport(dispatcher, fileCtx)
			if err != nil {
				return err
			}
		}

		logger.Log(fmt.Sprintf("[%d/%d]正在生成代码内容", index+1, len(configs)))
		for _, fileCtx := range dispatcher.FileStore {
			codegen_ts.Gen(fileCtx)
		}

		logger.Log(fmt.Sprintf("[%d/%d]正在创建代码文件", index+1, len(configs)))
		outDir := path.Clean(packageRoot + "/" + config.TargetDir)
		err = dispatcher.GenerateTypescript(outDir)
		if err != nil {
			return err
		}
		// 格式化Typescript代码并将结果输出
		wg.Add(1)
		go func(index int) {
			logger.Log(fmt.Sprintf("[%d/%d]正在格式化文件内容", index+1, len(configs)))
			exec.Command("npx", "prettier", "--write", outDir).Run()
			logger.Log(fmt.Sprintf("[%d/%d]已完成", index+1, len(configs)))
			wg.Done()
		}(index)
	}

	wg.Wait()

	return nil
}
