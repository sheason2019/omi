package main

import (
	"errors"
	"os"

	"github.com/sheason2019/omi/executable"
	"github.com/sheason2019/omi/utils"
	"github.com/urfave/cli/v2"
)

func main() {
	// 生成代码
	app := cli.App{
		Name:  "Omi-IDL",
		Usage: "一个用于同步前端和服务端之间接口代码的静态代码生成工具",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  "filePath",
				Value: "",
				Usage: "仅Token模式使用，指定文件的路径",
			},
			&cli.StringFlag{
				Name:  "fileContent",
				Value: "",
				Usage: "仅Token模式使用，指定文件的内容",
			},
			&cli.BoolFlag{
				Name:  "token",
				Value: false,
				Usage: "当该字段为true时，CLI不会生成代码，而是生成TokenList，配合VS Code实现代码高亮",
			},
			&cli.BoolFlag{
				Name:  "log",
				Value: true,
				Usage: "是否在代码生成过程中生成日志",
			},
		},
		Action: func(ctx *cli.Context) error {
			filePath := ctx.String("filePath")
			fileContent := ctx.String("fileContent")
			genToken := ctx.Bool("token")
			showLog := ctx.Bool("log")

			if genToken {
				if len(filePath) == 0 {
					return errors.New("生成Token时必须指定IDL文件")
				}
				outputData, _ := executable.GenToken(filePath, fileContent)
				utils.JsonLog(outputData.Pack())
			} else {
				err := executable.GenCode(filePath, showLog)
				if err != nil {
					return err
				}
			}

			return nil
		},
		Commands: []*cli.Command{
			{
				Name:    "sync",
				Aliases: []string{},
				Usage:   "sync remote repo file",
				Action: func(ctx *cli.Context) error {
					fp := ctx.String("filePath")
					return executable.SyncRemote(fp)
				},
			},
		},
	}

	err := app.Run(os.Args)
	if err != nil {
		utils.JsonLog(executable.ErrorOutput{
			Message: err.Error(),
		})
	}
}
