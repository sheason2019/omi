package executable

import (
	"fmt"
	"os"
	"strings"

	config_dispatcher "github.com/sheason2019/omi/config-dispatcher"
	"github.com/sheason2019/omi/utils"
)

// 同步远端代码
func SyncRemote(configPath string) error {
	configCtx, configPath, err := config_dispatcher.GetConfigContext(configPath)
	if err != nil {
		return err
	}

	// 拿到项目根目录的路径
	projectRoot := (configPath)[0:strings.LastIndex(configPath, "/")]
	remote := configCtx.Remote

	dirPath := projectRoot + "/" + remote.OutDir
	// 如果项目不存在则克隆远端代码到本地
	if !checkExist(&remote, projectRoot) {
		err := utils.ExecCommand("git", "clone", remote.Repository, dirPath)
		if err != nil {
			return err
		}
	}
	// 进入Git路径，fetch指定的分支并切换到其中
	script := fmt.Sprintf("cd %s\ngit fetch origin %s\ngit checkout %s", dirPath, remote.Branch, remote.Branch)
	err = utils.ExecCommand("sh", "-c", script)

	if err != nil {
		return err
	}

	fmt.Println(dirPath)
	return nil
}

// 检查本地是否已存在Git仓库
func checkExist(remote *config_dispatcher.Remote, projectRoot string) bool {
	_, err := os.Stat(projectRoot + "/" + remote.OutDir + "/.git")
	return err == nil
}
