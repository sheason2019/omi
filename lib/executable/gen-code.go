package executable

import (
	"fmt"
	"path"
	"strings"
	"sync"

	"github.com/sheason2019/omi/checker"
	"github.com/sheason2019/omi/codegen"
	config_dispatcher "github.com/sheason2019/omi/config-dispatcher"
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
)

func GenCode(configPath string, showLog bool) error {
	configCtx, configPath, err := config_dispatcher.GetConfigContext(configPath)
	if err != nil {
		return err
	}

	configs := configCtx.Configs

	// 拿到项目根目录的路径
	projectRoot := (configPath)[0:strings.LastIndex(configPath, "/")]

	wg := sync.WaitGroup{}
	errMap := make(map[int]error)
	// 根据配置文件解析出所有需要用到的语法树
	for index, config := range configs {
		dispatcher := file_dispatcher.New()
		dispatcher.ProjectRoot = projectRoot
		dispatcher.DefaultMethod = config.Method
		dispatcher.Lang = config.Lang

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

		err = codegen.GenCode(dispatcher, &config)
		if err != nil {
			return err
		}

		outDir := path.Clean(projectRoot + "/" + config.TargetDir)
		err = dispatcher.GenFile(outDir)
		if err != nil {
			return err
		}
		wg.Add(1)
		go func(index int) {
			// 格式化代码
			err := fmtCode(dispatcher.Lang, outDir)
			if err != nil {
				errMap[index] = err
			}
			wg.Done()
		}(index)
	}

	wg.Wait()

	if len(errMap) != 0 {
		return fmt.Errorf("%+v", errMap)
	}

	return nil
}
