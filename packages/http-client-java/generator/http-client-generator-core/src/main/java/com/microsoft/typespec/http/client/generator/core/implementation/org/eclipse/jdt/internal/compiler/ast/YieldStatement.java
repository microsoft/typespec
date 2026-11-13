// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) , 2024 IBM Corporation and others.
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
 *     Advantest R & D - Switch Expressions 2.0
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class YieldStatement extends BranchStatement {

    public Expression expression;

    public boolean isImplicit;

    public YieldStatement(Expression expression, boolean isImplicit, int sourceStart, int sourceEnd) {
        super(null, sourceStart, sourceEnd);
        this.expression = expression;
        this.isImplicit = isImplicit;
    }

    @Override
    public StringBuilder printStatement(int tab, StringBuilder output) {
        if (this.isImplicit) {
            this.expression.print(tab, output);
        } else {
            printIndent(tab, output).append("yield "); //$NON-NLS-1$
            this.expression.printExpression(tab, output);
        }
        return output.append(';');
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockscope) {
        if (visitor.visit(this)) {
            this.expression.traverse(visitor, blockscope);
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
