package main

import (
	"errors"
	"os"

	"github.com/sheason2019/omi/executable"
	"github.com/urfave/cli/v2"
)

func main() {
	// 生成代码
	app := cli.App{
		Name:  "Omi-IDL",
		Usage: "一个用于同步前端和服务端之间接口代码的静态代码生成工具",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  "file",
				Value: "",
				Usage: "指定配置文件的路径",
			},
			&cli.BoolFlag{
				Name:  "token",
				Value: false,
				Usage: "当该字段为true时，CLI不会生成代码，而是生成TokenList，配合VS Code实现代码高亮",
			},
		},
		Action: func(ctx *cli.Context) error {
			filePath := ctx.String("file")
			genToken := ctx.Bool("token")
			var err error
			if genToken {
				if len(filePath) == 0 {
					return errors.New("生成Token时必须指定IDL文件")
				}
				err = executable.GenToken(filePath)
			} else {
				err = executable.GenCode(filePath)
			}

			if err != nil {
				return err
			}

			return nil
		},
	}

	err := app.Run(os.Args)
	if err != nil {
		panic(err)
	}

}
