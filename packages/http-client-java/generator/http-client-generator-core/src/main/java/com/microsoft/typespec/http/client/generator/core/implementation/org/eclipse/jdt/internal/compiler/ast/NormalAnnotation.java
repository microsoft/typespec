// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2012 IBM Corporation and others.
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

/**
 * Normal annotation node
 */
public class NormalAnnotation extends Annotation {

    public MemberValuePair[] memberValuePairs;

    public NormalAnnotation(TypeReference type, int sourceStart) {
        this.type = type;
        this.sourceStart = sourceStart;
        this.sourceEnd = type.sourceEnd;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        super.printExpression(indent, output);
        output.append('(');
        if (this.memberValuePairs != null) {
            for (int i = 0, max = this.memberValuePairs.length; i < max; i++) {
                if (i > 0) {
                    output.append(',');
                }
                this.memberValuePairs[i].print(indent, output);
            }
        }
        output.append(')');
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        if (visitor.visit(this)) {
            if (this.type != null) {
                this.type.traverse(visitor, scope);
            }
            if (this.memberValuePairs != null) {
                int memberValuePairsLength = this.memberValuePairs.length;
                for (int i = 0; i < memberValuePairsLength; i++)
                    this.memberValuePairs[i].traverse(visitor, scope);
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
            if (this.memberValuePairs != null) {
                int memberValuePairsLength = this.memberValuePairs.length;
                for (int i = 0; i < memberValuePairsLength; i++)
                    this.memberValuePairs[i].traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
