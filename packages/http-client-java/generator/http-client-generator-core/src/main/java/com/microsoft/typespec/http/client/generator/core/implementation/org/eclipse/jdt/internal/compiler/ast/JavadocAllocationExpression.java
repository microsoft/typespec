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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;

public class JavadocAllocationExpression extends AllocationExpression {

    public JavadocAllocationExpression(int start, int end) {
        this.sourceStart = start;
        this.sourceEnd = end;
        this.bits |= 32768;
    }

    public JavadocAllocationExpression(long pos) {
        this((int) (pos >>> 32), (int) pos);
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.typeArguments != null) {
                for (TypeReference typeArgument : this.typeArguments) {
                    typeArgument.traverse(visitor, scope);
                }
            }
            if (this.type != null) { // enum constant scenario
                this.type.traverse(visitor, scope);
            }
            if (this.arguments != null) {
                for (Expression argument : this.arguments)
                    argument.traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.typeArguments != null) {
                for (TypeReference typeArgument : this.typeArguments) {
                    typeArgument.traverse(visitor);
                }
            }
            if (this.type != null) { // enum constant scenario
                this.type.traverse(visitor);
            }
            if (this.arguments != null) {
                for (Expression argument : this.arguments)
                    argument.traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
