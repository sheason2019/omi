package config_dispatcher

import (
	"errors"
	"os"
	"path"
	"strings"
)

const deafult_config_file_name = "omi.config.json"

// 寻找Config文件
func dispatchConfigPath(filePath *string) (string, error) {
	directory, err := os.Getwd()
	if err != nil {
		return "", err
	}

	// 当filepath参数不为空时，表示用户指定了一个文件进行访问
	if filePath != nil {
		if !path.IsAbs(*filePath) {
			absDir := directory + "/" + *filePath
			return path.Clean(absDir), nil
		}
		return *filePath, nil
	}

	// 否则向上遍历配置文件
	for len(directory) > 0 {
		filePath := directory + `/` + deafult_config_file_name
		exist, err := fileExist(filePath)
		if err != nil {
			return "", err
		}
		if exist {
			return filePath, nil
		} else {
			directory = getParentDirectory(directory)
		}
	}

	return "", errors.New("文件不存在")
}

func fileExist(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func getParentDirectory(directory string) string {
	index := strings.LastIndex(directory, "/")
	if index < 1 {
		return ""
	}
	return directory[0:index]
}
