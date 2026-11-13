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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class JavadocMessageSend extends MessageSend {

    public JavadocMessageSend(char[] name, long pos) {
        this.selector = name;
        this.nameSourcePosition = pos;
        this.sourceStart = (int) (this.nameSourcePosition >>> 32);
        this.sourceEnd = (int) this.nameSourcePosition;
        this.bits |= 32768;
    }

    public JavadocMessageSend(char[] name, long pos, JavadocArgumentExpression[] arguments) {
        this(name, pos);
        this.arguments = arguments;
    }

    @Override
    public boolean isSuperAccess() {
        return (this.bits & 16384) != 0;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        if (this.receiver != null) {
            this.receiver.printExpression(0, output);
        }
        output.append('#').append(this.selector).append('(');
        if (this.arguments != null) {
            for (int i = 0; i < this.arguments.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.arguments[i].printExpression(0, output);
            }
        }
        return output.append(')');
    }

    /* Redefine to capture javadoc specific signatures */
    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.receiver != null) {
                this.receiver.traverse(visitor, blockScope);
            }
            if (this.arguments != null) {
                int argumentsLength = this.arguments.length;
                for (int i = 0; i < argumentsLength; i++)
                    this.arguments[i].traverse(visitor, blockScope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    /* Redefine to capture javadoc specific signatures */
    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.receiver != null) {
                this.receiver.traverse(visitor);
            }
            if (this.arguments != null) {
                int argumentsLength = this.arguments.length;
                for (int i = 0; i < argumentsLength; i++)
                    this.arguments[i].traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
