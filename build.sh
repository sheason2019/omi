cd ./lib
# 交叉编译
GOOS=linux GOARCH=amd64 go build -o ./dist/linux-amd64/omi
GOOS=darwin GOARCH=amd64 go build -o ./dist/darwin-amd64/omi