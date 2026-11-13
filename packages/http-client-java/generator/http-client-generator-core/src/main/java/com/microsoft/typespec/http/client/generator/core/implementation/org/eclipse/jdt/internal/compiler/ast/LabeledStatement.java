// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2018 IBM Corporation and others.
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

public class LabeledStatement extends Statement {

    public Statement statement;
    public char[] label;

    public int labelEnd;

    /**
     * LabeledStatement constructor comment.
     */
    public LabeledStatement(char[] label, Statement statement, long labelPosition, int sourceEnd) {
        this.statement = statement;
        // remember useful empty statement
        if (statement instanceof EmptyStatement)
            statement.bits |= 1;
        this.label = label;
        this.sourceStart = (int) (labelPosition >>> 32);
        this.labelEnd = (int) labelPosition;
        this.sourceEnd = sourceEnd;
    }

    @Override
    public StringBuilder printStatement(int tab, StringBuilder output) {
        printIndent(tab, output).append(this.label).append(": "); //$NON-NLS-1$
        if (this.statement == null)
            output.append(';');
        else
            this.statement.printStatement(0, output);
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.statement != null)
                this.statement.traverse(visitor, blockScope);
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
