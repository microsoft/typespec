// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2013 IBM Corporation and others.
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
 *     Jesper Steen Moller - Contributions for:
 *          Bug 412149: [1.8][compiler] Emit repeated annotations into the designated container
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

/**
 * SingleMemberAnnotation node
 */
public class SingleMemberAnnotation extends Annotation {

    public Expression memberValue;

    public SingleMemberAnnotation(TypeReference type, int sourceStart) {
        this.type = type;
        this.sourceStart = sourceStart;
        this.sourceEnd = type.sourceEnd;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        super.printExpression(indent, output);
        output.append('(');
        this.memberValue.printExpression(indent, output);
        return output.append(')');
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        if (visitor.visit(this)) {
            if (this.type != null) {
                this.type.traverse(visitor, scope);
            }
            if (this.memberValue != null) {
                this.memberValue.traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.type != null) {
                this.type.traverse(visitor);
            }
            if (this.memberValue != null) {
                this.memberValue.traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
