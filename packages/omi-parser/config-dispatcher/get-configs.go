package config_dispatcher

import (
	"encoding/json"
	"os"
)

func GetConfigs(filePath *string) ([]ConfigContext, error) {
	configContent, err := getConfigContent(filePath)
	if err != nil {
		return nil, err
	}

	// 首先尝试使用单对象初始化Config
	config := ConfigContext{}
	err = json.Unmarshal(configContent, &config)
	if err == nil {
		return []ConfigContext{config}, nil
	}

	// 若失败则使用数组尝试JSON化
	configs := []ConfigContext{}
	err = json.Unmarshal(configContent, &configs)

	return configs, err
}

func getConfigContent(path *string) ([]byte, error) {
	filePath, err := dispatchConfigPath(path)
	if err != nil {
		return nil, err
	}

	configContent, err := os.ReadFile(filePath)

	return configContent, err
}
