package config_dispatcher

import (
	"fmt"
	"testing"
)

func TestGetConfigContent(t *testing.T) {
	path := "../../../omi.config.json"
	content, err := getConfigContent(&path)
	if err != nil {
		t.Error(err)
	}
	fmt.Println(content)
}

func TestGetConfigsByPath(t *testing.T) {
	path := "../../../omi.config.json"
	configs, err := GetConfigs(&path)
	if err != nil {
		t.Error(err)
	}
	fmt.Printf("%+v\n", configs)
}

func TestGetConfigsByAbsPath(t *testing.T) {
	absPath := "/root/workspace/omi/omi.config.json"
	configs, err := GetConfigs(&absPath)
	if err != nil {
		t.Error(err)
	}
	fmt.Printf("%+v\n", configs)
}

func TestGetConfigsByDefault(t *testing.T) {
	configs, err := GetConfigs(nil)
	if err != nil {
		t.Error(err)
	}
	fmt.Printf("%+v\n", configs)
}
