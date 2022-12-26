package tree_builder

// 将会停在当前语句的末尾
func nextSyntax(ts *TokenStream) {
	startToken := ts.Read()
	for {
		token := ts.Read()
		// 为空时返回
		if token == nil {
			break
		}
		if token.Content == ";" || token.Content == "}" || token.Line != startToken.Line {
			break
		}
		ts.NextUseful()
	}
}
