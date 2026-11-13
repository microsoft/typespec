// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2010 IBM Corporation and others.
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

public class JavadocArgumentExpression extends Expression {
    public char[] token;
    public Argument argument;

    public JavadocArgumentExpression(char[] name, int startPos, int endPos, TypeReference typeRef) {
        this.token = name;
        this.sourceStart = startPos;
        this.sourceEnd = endPos;
        long pos = (((long) startPos) << 32) + endPos;
        this.argument = new Argument(name, pos, typeRef, 0);
        this.bits |= 32768;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        if (this.argument == null) {
            if (this.token != null) {
                output.append(this.token);
            }
        } else {
            this.argument.print(indent, output);
        }
        return output;
    }

    /* Redefine to capture javadoc specific signatures */
    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.argument != null) {
                this.argument.traverse(visitor, blockScope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.argument != null) {
                this.argument.traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
