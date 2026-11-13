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
 *     Stephan Herrmann - Contributions for
 *								bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 368546 - [compiler][resource] Avoid remaining false positives found when compiling the Eclipse SDK
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								bug 402993 - [null] Follow up of bug 401088: Missing warning about redundant null check
 *								Bug 440282 - [resource] Resource leak detection false negative with empty finally block
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class Block extends Statement {

    public Statement[] statements;

    public Block(int explicitDeclarations) {
    }

    public StringBuilder printBody(int indent, StringBuilder output) {
        if (this.statements == null)
            return output;
        for (Statement statement : this.statements) {
            statement.printStatement(indent + 1, output);
            output.append('\n');
        }
        return output;
    }

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        printIndent(indent, output);
        output.append("{\n"); //$NON-NLS-1$
        printBody(indent, output);
        return printIndent(indent, output).append('}');
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        if (visitor.visit(this)) {
            if (this.statements != null) {
                for (Statement statement : this.statements)
                    statement.traverse(visitor, ((BlockScope) null));
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
