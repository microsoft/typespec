// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class PostfixExpression extends CompoundAssignment {

    public PostfixExpression(Expression lhs, int operator, int pos) {
        super(lhs, IntLiteral.One, operator, pos);
        this.sourceStart = lhs.sourceStart;
        this.sourceEnd = pos;
    }

    @Override
    public String operatorToString() {
        switch (this.operator) {
            case 14:
                return "++"; //$NON-NLS-1$

            case 13:
                return "--"; //$NON-NLS-1$
        }
        return "unknown operator"; //$NON-NLS-1$
    }

    @Override
    public StringBuilder printExpressionNoParenthesis(int indent, StringBuilder output) {
        return this.lhs.printExpression(indent, output).append(' ').append(operatorToString());
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.lhs.traverse(visitor, scope);
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
