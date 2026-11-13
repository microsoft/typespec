// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class BreakStatement extends BranchStatement {

    public BreakStatement(char[] label, int sourceStart, int e) {
        super(label, sourceStart, e);
    }

    @Override
    public StringBuilder printStatement(int tab, StringBuilder output) {
        printIndent(tab, output).append("break"); //$NON-NLS-1$
        if (this.label != null)
            output.append(' ').append(this.label);
        return output.append(';');
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockscope) {
        visitor.visit(this);
        java.util.Objects.requireNonNull(visitor);
    }

}
