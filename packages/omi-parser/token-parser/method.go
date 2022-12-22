/*
* 这里用来存储一些在解析Token时会用到的通用方法
**/
package token_parser

func exist(bytes []byte, target byte) bool {
	for _, b := range bytes {
		if b == target {
			return true
		}
	}
	return false
}
