// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2011 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public abstract class NumberLiteral extends Literal {

    char[] source;

    public NumberLiteral(char[] token, int s, int e) {
        this(s, e);
        this.source = token;
    }

    public NumberLiteral(int s, int e) {
        super(s, e);
    }

    protected static char[] removePrefixZerosAndUnderscores(char[] token, boolean isLong) {
        int max = token.length;
        int start = 0;
        int end = max - 1;
        if (isLong) {
            end--; // remove the 'L' or 'l'
        }
        if (max > 1 && token[0] == '0') {
            if (max > 2 && (token[1] == 'x' || token[1] == 'X')) {
                start = 2;
            } else if (max > 2 && (token[1] == 'b' || token[1] == 'B')) {
                start = 2;
            } else {
                start = 1;
            }
        }
        boolean modified = false;
        boolean ignore = true;
        loop: for (int i = start; i < max; i++) {
            char currentChar = token[i];
            switch (currentChar) {
                case '0':
                    // this is a prefix '0'
                    if (ignore && !modified && (i < end)) {
                        modified = true;
                    }
                    break;

                case '_':
                    modified = true;
                    break loop;

                default:
                    ignore = false;
            }
        }
        if (!modified) {
            return token;
        }
        ignore = true;
        StringBuilder buffer = new StringBuilder();
        buffer.append(token, 0, start);
        for (int i = start; i < max; i++) {
            char currentChar = token[i];
            switch (currentChar) {
                case '0':
                    if (ignore && (i < end)) {
                        // this is a prefix '0'
                        continue;
                    }
                    break;

                case '_':
                    continue;

                default:
                    ignore = false;
            }
            buffer.append(currentChar);
        }
        return buffer.toString().toCharArray();
    }
}
