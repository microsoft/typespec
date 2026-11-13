// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2024 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.StringConstant;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;

public class StringLiteral extends Literal {

    /** may be null, prefixes tail **/
    protected StringLiteral optionalHead;
    /** StringLiteral or char[] tail **/
    protected Object tail;
    /** zero based **/
    private final int lineNumber;

    public StringLiteral(char[] token, int start, int end, int lineNumber1based) {
        this(null, token, start, end, lineNumber1based - 1);
    }

    protected StringLiteral(StringLiteral optionalHead, Object tail, int start, int end, int lineNumber) {
        super(start, end);
        this.optionalHead = optionalHead;
        this.tail = tail;
        this.lineNumber = lineNumber;
    }

    public void computeConstant() {
        this.constant = StringConstant.fromValue(String.valueOf(this.source()));
    }

    /**
     * creates a copy of dedicated Type for optimizeStringLiterals with the given CharLiteral appended
     */
    public ExtendedStringLiteral extendWith(CharLiteral lit) {
        char[] charTail = new char[] { lit.value };
        return new ExtendedStringLiteral(this, charTail, this.sourceStart, lit.sourceEnd, this.getLineNumber());
    }

    /**
     * creates a copy of dedicated Type for optimizeStringLiterals with the given StringLiteral appended
     */
    public ExtendedStringLiteral extendWith(StringLiteral lit) {
        return new ExtendedStringLiteral(this, lit, this.sourceStart, lit.sourceEnd, this.getLineNumber());
    }

    /**
     * creates a copy of dedicated Type for unoptimizeStringLiterals with the given StringLiteral appended
     */
    public StringLiteralConcatenation extendsWith(StringLiteral lit) {
        return new StringLiteralConcatenation(this, lit);
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        // handle some special char.....
        output.append('\"');
        for (char s : source()) {
            Util.appendEscapedChar(output, s);
        }
        output.append('\"');
        return output;
    }

    @Override
    public char[] source() {
        if (this.optionalHead == null && this.tail instanceof char[] ch) {
            // fast path without copy
            return ch;
        }
        // flatten linked list to char[]
        int size = append(null, 0, this);
        char[] result = new char[size];
        append(result, 0, this);
        flatten(result);
        return result;
    }

    protected void flatten(char[] result) {
        setSource(result); // keep flat version
    }

    private static int append(char[] result, int length, StringLiteral o) {
        do {
            if (o.tail instanceof char[] c) {
                if (result != null) {
                    System.arraycopy(c, 0, result, result.length - c.length - length, c.length);
                }
                length += c.length;
            } else {
                length = append(result, length, ((StringLiteral) o.tail));
            }
            o = o.optionalHead;
        } while (o != null);
        return length;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        java.util.Objects.requireNonNull(visitor);
    }

    public void setSource(char[] source) {
        this.tail = source;
        this.optionalHead = null;
    }

    public int getLineNumber() {
        return this.lineNumber;
    }
}
