// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2026 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameTextBlock;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.TextBlock;

public class TextBlockReplacePreparator extends ASTVisitor {

    final private TokenManager tokenManager;
    final private DefaultCodeFormatterOptions options;

    public TextBlockReplacePreparator(TokenManager tokenManager, DefaultCodeFormatterOptions options) {
        this.tokenManager = tokenManager;
        this.options = options;
    }

    @Override
    public boolean visit(TextBlock node) {
        Token block = this.tokenManager.firstTokenIn(node, TokenNameTextBlock);
        if (this.options.put_text_block_quotes_on_new_line && block instanceof TokenTextBlock) {
            if (needFormat(block)) {
                ((TokenTextBlock) block).setReplace();
            }
        }
        return true;
    }

    public boolean needFormat(Token block) {
        for (int i = block.originalEnd - 3; i > block.originalStart; i--) {
            char ch = this.tokenManager.charAt(i);
            if (ch == ' ' || ch == '\t')
                continue;
            if (ch == '\n') {
                return false;
            } else {
                break;
            }
        }
        return true;
    }
}
