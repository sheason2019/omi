package config_dispatcher

import (
	"encoding/json"
	"os"
)

func GetConfigs(filePath string) ([]ConfigContext, string, error) {
	configContent, filePath, err := getConfigInfo(filePath)
	if err != nil {
		return nil, "", err
	}

	// 首先尝试使用单对象初始化Config
	config := ConfigContext{}
	err = json.Unmarshal(configContent, &config)
	if err == nil {
		return []ConfigContext{config}, filePath, nil
	}

	// 若失败则使用数组尝试JSON化
	configs := []ConfigContext{}
	err = json.Unmarshal(configContent, &configs)

	return configs, filePath, err
}

// 根据路径获取Config相关的信息
func getConfigInfo(path string) ([]byte, string, error) {
	filePath, err := dispatchConfigPath(path)
	if err != nil {
		return nil, filePath, err
	}

	configContent, err := os.ReadFile(filePath)

	return configContent, filePath, err
}
