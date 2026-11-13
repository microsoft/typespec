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
 *								bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *								Bug 415790 - [compiler][resource]Incorrect potential resource leak warning in for loop with close in try/catch
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class ForStatement extends Statement {

    public Statement[] initializations;
    public Expression condition;
    public Statement[] increments;
    public Statement action;

    public ForStatement(Statement[] initializations, Expression condition, Statement[] increments, Statement action,
        boolean neededScope, int s, int e) {
        this.sourceStart = s;
        this.sourceEnd = e;
        this.initializations = initializations;
        this.condition = condition;
        this.increments = increments;
        this.action = action;
        // remember useful empty statement
        if (action instanceof EmptyStatement)
            action.bits |= 1;
        if (neededScope) {
            this.bits |= 536870912;
        }
    }

    @Override
    public StringBuilder printStatement(int tab, StringBuilder output) {
        printIndent(tab, output).append("for ("); //$NON-NLS-1$
        // inits
        if (this.initializations != null) {
            for (int i = 0; i < this.initializations.length; i++) {
                // nice only with expressions
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.initializations[i].print(0, output);
            }
        }
        output.append("; "); //$NON-NLS-1$
        // cond
        if (this.condition != null)
            this.condition.printExpression(0, output);
        output.append("; "); //$NON-NLS-1$
        // updates
        if (this.increments != null) {
            for (int i = 0; i < this.increments.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.increments[i].print(0, output);
            }
        }
        output.append(") "); //$NON-NLS-1$
        // block
        if (this.action == null)
            output.append(';');
        else {
            output.append('\n');
            this.action.printStatement(tab + 1, output);
        }
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        if (visitor.visit(this)) {
            if (this.initializations != null) {
                int initializationsLength = this.initializations.length;
                for (int i = 0; i < initializationsLength; i++)
                    this.initializations[i].traverse(visitor, ((BlockScope) null));
            }

            if (this.condition != null)
                this.condition.traverse(visitor, ((BlockScope) null));

            if (this.increments != null) {
                int incrementsLength = this.increments.length;
                for (int i = 0; i < incrementsLength; i++)
                    this.increments[i].traverse(visitor, ((BlockScope) null));
            }

            if (this.action != null)
                this.action.traverse(visitor, ((BlockScope) null));
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
