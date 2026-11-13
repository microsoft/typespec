// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2021 IBM Corporation and others.
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
 *     Stephan Herrmann - Contributions for
 *     							bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 *     							bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class IfStatement extends Statement {

    public Expression condition;
    public Statement thenStatement;
    public Statement elseStatement;

    public IfStatement(Expression condition, Statement thenStatement, int sourceStart, int sourceEnd) {
        this.condition = condition;
        this.thenStatement = thenStatement;
        // remember useful empty statement
        if (thenStatement instanceof EmptyStatement)
            thenStatement.bits |= 1;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
    }

    public IfStatement(Expression condition, Statement thenStatement, Statement elseStatement, int sourceStart,
        int sourceEnd) {
        this.condition = condition;
        this.thenStatement = thenStatement;
        // remember useful empty statement
        if (thenStatement instanceof EmptyStatement)
            thenStatement.bits |= 1;
        this.elseStatement = elseStatement;
        if (elseStatement instanceof IfStatement)
            elseStatement.bits |= 536870912;
        if (elseStatement instanceof EmptyStatement)
            elseStatement.bits |= 1;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
    }

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        printIndent(indent, output).append("if ("); //$NON-NLS-1$
        this.condition.printExpression(0, output).append(")\n");	//$NON-NLS-1$
        this.thenStatement.printStatement(indent + 2, output);
        if (this.elseStatement != null) {
            output.append('\n');
            printIndent(indent, output);
            output.append("else\n"); //$NON-NLS-1$
            this.elseStatement.printStatement(indent + 2, output);
        }
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.condition.traverse(visitor, blockScope);
            if (this.thenStatement != null)
                this.thenStatement.traverse(visitor, blockScope);
            if (this.elseStatement != null)
                this.elseStatement.traverse(visitor, blockScope);
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
