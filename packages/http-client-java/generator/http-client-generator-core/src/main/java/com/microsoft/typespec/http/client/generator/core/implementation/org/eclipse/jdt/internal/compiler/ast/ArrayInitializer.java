// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2014 IBM Corporation and others.
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
 *								bug 368546 - [compiler][resource] Avoid remaining false positives found when compiling the Eclipse SDK
 *								bug 370639 - [compiler][resource] restore the default for resource leak warnings
 *								bug 388996 - [compiler][resource] Incorrect 'potential resource leak'
 *								Bug 417758 - [1.8][null] Null safety compromise during array creation.
 *								Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *								Bug 435805 - [1.8][compiler][null] Java 8 compiler does not recognize declaration style null annotations
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class ArrayInitializer extends Expression {

    public Expression[] expressions;

    /**
     * ArrayInitializer constructor comment.
     */
    public ArrayInitializer() {
        super();
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        output.append('{');
        if (this.expressions != null) {
            int j = 20;
            for (int i = 0; i < this.expressions.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.expressions[i].printExpression(0, output);
                j--;
                if (j == 0) {
                    output.append('\n');
                    printIndent(indent + 1, output);
                    j = 20;
                }
            }
        }
        return output.append('}');
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.expressions != null) {
                int expressionsLength = this.expressions.length;
                for (int i = 0; i < expressionsLength; i++)
                    this.expressions[i].traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
