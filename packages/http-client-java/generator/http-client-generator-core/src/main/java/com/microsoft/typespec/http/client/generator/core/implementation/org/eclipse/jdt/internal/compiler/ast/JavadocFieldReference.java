// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2011 IBM Corporation and others.
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
 *     Stephan Herrmann <stephan@cs.tu-berlin.de> - Contribution for bug 185682 - Increment/decrement operators mark local variables as read
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;

public class JavadocFieldReference extends FieldReference {

    public JavadocFieldReference(char[] source, long pos) {
        super(source, pos);
        this.bits |= 32768;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        if (this.receiver != null) {
            this.receiver.printExpression(0, output);
        }
        output.append('#').append(this.token);
        return output;
    }

    /* Redefine to capture javadoc specific signatures */
    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.receiver != null) {
                this.receiver.traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.receiver != null) {
                this.receiver.traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
