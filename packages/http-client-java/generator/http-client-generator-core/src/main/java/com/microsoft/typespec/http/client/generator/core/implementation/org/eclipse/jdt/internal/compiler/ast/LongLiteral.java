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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class LongLiteral extends NumberLiteral {

    private static final char[] HEXA_MIN_VALUE = "0x8000000000000000L".toCharArray(); //$NON-NLS-1$
    private static final char[] OCTAL_MIN_VALUE = "01000000000000000000000L".toCharArray(); //$NON-NLS-1$
    private static final char[] DECIMAL_MIN_VALUE = "9223372036854775808L".toCharArray(); //$NON-NLS-1$

    private final char[] reducedForm; // no underscores

    public static LongLiteral buildLongLiteral(char[] token, int s, int e) {
        // remove '_' and prefix '0' first
        char[] longReducedToken = removePrefixZerosAndUnderscores(token, true);
        switch (longReducedToken.length) {
            case 19:
                // 0x8000000000000000L
                if (CharOperation.equals(longReducedToken, HEXA_MIN_VALUE)) {
                    return new LongLiteralMinValue(token, longReducedToken != token ? longReducedToken : null, s, e);
                }
                break;

            case 24:
                // 01000000000000000000000L
                if (CharOperation.equals(longReducedToken, OCTAL_MIN_VALUE)) {
                    return new LongLiteralMinValue(token, longReducedToken != token ? longReducedToken : null, s, e);
                }
                break;
        }
        return new LongLiteral(token, longReducedToken != token ? longReducedToken : null, s, e);
    }

    LongLiteral(char[] token, char[] reducedForm, int start, int end) {
        super(token, start, end);
        this.reducedForm = reducedForm;
    }

    public LongLiteral convertToMinValue() {
        if (((this.bits & 534773760) >> 21) != 0) {
            return this;
        }
        char[] token = this.reducedForm != null ? this.reducedForm : this.source;
        switch (token.length) {
            case 20:
                // 9223372036854775808L
                if (CharOperation.equals(token, DECIMAL_MIN_VALUE, false)) {
                    return new LongLiteralMinValue(this.source, this.reducedForm, this.sourceStart, this.sourceEnd);
                }
                break;
        }
        return this;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        java.util.Objects.requireNonNull(visitor);
    }
}
