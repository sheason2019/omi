package utils

import (
	"fmt"
	"os"
	"regexp"
)

// 获取指定路径的信息
func PathType(p string) (isDir bool, exist bool) {
	s, err := os.Stat(p)
	if err != nil {
		fmt.Println(err)
		return false, false
	}

	return s.IsDir(), true
}

func GetOmiFilesPath(dirname string) ([]string, error) {
	f, err := os.Open(dirname)
	if err != nil {
		return nil, err
	}
	files, err := f.ReadDir(-1)
	f.Close()

	if err != nil {
		return nil, err
	}

	paths := []string{}
	for _, file := range files {
		if IsOmiFile(file.Name()) {
			paths = append(paths, dirname+"/"+file.Name())
		}
	}
	return paths, nil
}

// 使用正则表达式判断是否为Omi文件
func IsOmiFile(filename string) bool {
	reg, _ := regexp.Compile(`\.omi$`)
	return reg.Match([]byte(filename))
}
