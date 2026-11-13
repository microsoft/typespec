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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.Constant;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.IntConstant;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class IntLiteral extends NumberLiteral {
    private static final char[] HEXA_MIN_VALUE = "0x80000000".toCharArray(); //$NON-NLS-1$
    private static final char[] OCTAL_MIN_VALUE = "020000000000".toCharArray(); //$NON-NLS-1$
    private static final char[] DECIMAL_MIN_VALUE = "2147483648".toCharArray(); //$NON-NLS-1$

    private final char[] reducedForm; // no underscores

    // used for ++ and --
    public static final IntLiteral One = new IntLiteral(new char[] { '1' }, null, 0, 0, IntConstant.fromValue(1));

    public static IntLiteral buildIntLiteral(char[] token, int s, int e) {
        // remove '_' and prefix '0' first
        char[] intReducedToken = removePrefixZerosAndUnderscores(token, false);
        switch (intReducedToken.length) {
            case 10:
                // 0x80000000
                if (CharOperation.equals(intReducedToken, HEXA_MIN_VALUE)) {
                    return new IntLiteralMinValue(token, intReducedToken != token ? intReducedToken : null, s, e);
                }
                break;

            case 12:
                // 020000000000
                if (CharOperation.equals(intReducedToken, OCTAL_MIN_VALUE)) {
                    return new IntLiteralMinValue(token, intReducedToken != token ? intReducedToken : null, s, e);
                }
                break;
        }
        return new IntLiteral(token, intReducedToken != token ? intReducedToken : null, s, e);
    }

    IntLiteral(char[] token, char[] reducedForm, int start, int end) {
        super(token, start, end);
        this.reducedForm = reducedForm;
    }

    IntLiteral(char[] token, char[] reducedForm, int start, int end, Constant constant) {
        super(token, start, end);
        this.reducedForm = reducedForm;
        this.constant = constant;
    }

    public IntLiteral convertToMinValue() {
        if (((this.bits & 534773760) >> 21) != 0) {
            return this;
        }
        char[] token = this.reducedForm != null ? this.reducedForm : this.source;
        switch (token.length) {
            case 10:
                // 2147483648
                if (CharOperation.equals(token, DECIMAL_MIN_VALUE)) {
                    return new IntLiteralMinValue(this.source, this.reducedForm, this.sourceStart, this.sourceEnd);
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
