// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2020 IBM Corporation and others.
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
 *     Stephan Herrmann - Contribution for
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								bug 402993 - [null] Follow up of bug 401088: Missing warning about redundant null check
 *     Jesper S Moller - Contributions for
 *								bug 382721 - [1.8][compiler] Effectively final variables needs special treatment
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class CompoundAssignment extends Assignment {
    public int operator;

    public CompoundAssignment(Expression lhs, Expression expression, int operator, int sourceEnd) {
        // lhs is always a reference by construction ,
        // but is build as an expression ==> the checkcast cannot fail

        super(lhs, expression, sourceEnd);
        lhs.bits &= ~8192; // tag lhs as NON assigned - it is also a read access
        lhs.bits |= 65536; // tag lhs as assigned by compound
        this.operator = operator;
    }

    public String operatorToString() {
        switch (this.operator) {
            case 14:
                return "+="; //$NON-NLS-1$

            case 13:
                return "-="; //$NON-NLS-1$

            case 15:
                return "*="; //$NON-NLS-1$

            case 9:
                return "/="; //$NON-NLS-1$

            case 2:
                return "&="; //$NON-NLS-1$

            case 3:
                return "|="; //$NON-NLS-1$

            case 8:
                return "^="; //$NON-NLS-1$

            case 16:
                return "%="; //$NON-NLS-1$

            case 10:
                return "<<="; //$NON-NLS-1$

            case 17:
                return ">>="; //$NON-NLS-1$

            case 19:
                return ">>>="; //$NON-NLS-1$
        }
        return "unknown operator"; //$NON-NLS-1$
    }

    @Override
    public StringBuilder printExpressionNoParenthesis(int indent, StringBuilder output) {
        this.lhs.printExpression(indent, output).append(' ').append(operatorToString()).append(' ');
        return this.expression.printExpression(0, output);
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.lhs.traverse(visitor, scope);
            this.expression.traverse(visitor, scope);
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
