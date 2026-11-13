// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2023 IBM Corporation and others.
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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class BinaryExpression extends OperatorExpression {

    public Expression left, right;

    public BinaryExpression(Expression left, Expression right, int operator) {
        this.left = left;
        this.right = right;
        this.bits |= operator << 8; // encode operator
        this.sourceStart = left.sourceStart;
        this.sourceEnd = right.sourceEnd;
    }

    public BinaryExpression(BinaryExpression expression) {
        this.left = expression.left;
        this.right = expression.right;
        this.bits = expression.bits;
        this.sourceStart = expression.sourceStart;
        this.sourceEnd = expression.sourceEnd;
    }

    @Override
    public StringBuilder printExpressionNoParenthesis(int indent, StringBuilder output) {
        // keep implementation in sync with
        // CombinedBinaryExpression#printExpressionNoParenthesis
        this.left.printExpression(indent, output).append(' ').append(operatorToString()).append(' ');
        return this.right.printExpression(0, output);
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.left.traverse(visitor, scope);
            this.right.traverse(visitor, scope);
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
