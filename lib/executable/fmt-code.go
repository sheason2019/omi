package executable

import (
	"os/exec"
	"strings"
)

// 格式化代码内容
func fmtCode(lang, outDir string) (err error) {
	if lang == "ts" {
		err = exec.Command("prettier", "--write", outDir).Run()
	} else if lang == "go" {
		output, err := exec.Command("find", outDir, "-name", "*.go").Output()
		if err != nil {
			return err
		}
		filePaths := strings.Split(string(output), "\n")
		for _, filePath := range filePaths {
			if len(filePath) == 0 {
				continue
			}
			err := exec.Command("gofmt", "-w", filePath).Run()
			if err != nil {
				return err
			}
		}
	}

	return
}
