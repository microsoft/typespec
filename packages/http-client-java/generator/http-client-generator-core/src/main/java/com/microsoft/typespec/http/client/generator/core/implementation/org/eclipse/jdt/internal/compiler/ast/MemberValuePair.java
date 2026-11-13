// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 365519 - editorial cleanup after bug 186342 and bug 365387
 *								Bug 434570 - Generic type mismatch for parametrized class annotation attribute with inner class
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

/**
 * MemberValuePair node
 */
public class MemberValuePair extends ASTNode {

    public char[] name;
    public Expression value;

    public MemberValuePair(char[] token, int sourceStart, int sourceEnd, Expression value) {
        this.name = token;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
        this.value = value;
        if (value instanceof ArrayInitializer) {
            value.bits |= 1;
        }
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        output.append(this.name).append(" = "); //$NON-NLS-1$
        this.value.print(0, output);
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.value != null) {
                this.value.traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.value != null) {
                this.value.traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
