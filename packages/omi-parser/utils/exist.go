package utils

func Exist[T byte | string](list []T, target T) bool {
	for _, b := range list {
		if b == target {
			return true
		}
	}
	return false
}
