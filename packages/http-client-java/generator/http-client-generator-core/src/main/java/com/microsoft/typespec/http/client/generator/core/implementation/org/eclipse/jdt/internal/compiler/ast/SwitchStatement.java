// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
 *								bug 265744 - Enum switch should warn about missing default
 *								bug 374605 - Unreasonable warning for enum-based switch statements
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *     Advantest R & D - Enhanced Switch v2.0
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class SwitchStatement extends Expression {

    public Expression expression;
    public Statement[] statements;

    public int blockStart;

    /* package */ // TODO: can we remove this?

    @Override
    public boolean isTrulyExpression() {
        return false;
    }

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        printIndent(indent, output).append("switch ("); //$NON-NLS-1$
        this.expression.printExpression(0, output).append(") {"); //$NON-NLS-1$
        if (this.statements != null) {
            for (Statement statement : this.statements) {
                output.append('\n');
                if (statement instanceof CaseStatement)
                    statement.printStatement(indent, output);
                else
                    statement.printStatement(indent + 2, output);
            }
        }
        output.append("\n"); //$NON-NLS-1$
        return printIndent(indent, output).append('}');
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        return printStatement(indent, output);
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        if (visitor.visit(this)) {
            this.expression.traverse(visitor, blockScope);
            if (this.statements != null)
                for (Statement statement : this.statements)
                    statement.traverse(visitor, ((BlockScope) null));
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
