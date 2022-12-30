package tree_builder

// 将会停在当前语句的末尾
func nextSyntax(ts *TokenStream) {
	for {
		token := ts.Read()
		// 为空时返回
		if token == nil {
			break
		}
		if token.Content == ";" || token.Content == "}" {
			break
		}
		ts.NextUseful()
	}
}
