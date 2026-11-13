// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2011, 2014 IBM Corporation and others.
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
 *							Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 409236 - [1.8][compiler] Type annotations on intersection cast types dropped by code generator
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class IntersectionCastTypeReference extends TypeReference {
    public TypeReference[] typeReferences;

    public IntersectionCastTypeReference(TypeReference[] typeReferences) {
        this.typeReferences = typeReferences;
        this.sourceStart = typeReferences[0].sourceStart;
        int length = typeReferences.length;
        this.sourceEnd = typeReferences[length - 1].sourceEnd;
        for (TypeReference reference : typeReferences) {
            if ((reference.bits & 1048576) != 0) {
                this.bits |= 1048576;
                break;
            }
        }
    }

    @Override
    public TypeReference augmentTypeWithAdditionalDimensions(int additionalDimensions,
        Annotation[][] additionalAnnotations, boolean isVarargs) {
        throw new UnsupportedOperationException(); // no syntax for this.
    }

    @Override
    public char[] getLastToken() {
        return null;
    }

    @Override
    public char[][] getTypeName() {
        // we need to keep a return value that is a char[][]
        return this.typeReferences[0].getTypeName();
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            int length = this.typeReferences == null ? 0 : this.typeReferences.length;
            for (int i = 0; i < length; i++) {
                this.typeReferences[i].traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        throw new UnsupportedOperationException(
            "Unexpected traversal request: IntersectionTypeReference in class scope"); //$NON-NLS-1$
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        int length = this.typeReferences == null ? 0 : this.typeReferences.length;
        printIndent(indent, output);
        for (int i = 0; i < length; i++) {
            this.typeReferences[i].printExpression(0, output);
            if (i != length - 1) {
                output.append(" & "); //$NON-NLS-1$
            }
        }
        return output;
    }
}
