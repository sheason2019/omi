package config_dispatcher

import (
	"encoding/json"
	"os"
)

func GetConfigContext(filePath string) (*ConfigContext, string, error) {
	configContent, filePath, err := getConfigInfo(filePath)
	if err != nil {
		return nil, "", err
	}

	configCtx := ConfigContext{}
	err = json.Unmarshal(configContent, &configCtx)

	return &configCtx, filePath, err
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
