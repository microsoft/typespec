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
 *     Stephan Herrmann - Contribution for
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class SingleTypeReference extends TypeReference {

    public char[] token;

    public SingleTypeReference(char[] source, long pos) {
        this.token = source;
        this.sourceStart = (int) (pos >>> 32);
        this.sourceEnd = (int) (pos & 0x00000000FFFFFFFFL);
    }

    @Override
    public TypeReference augmentTypeWithAdditionalDimensions(int additionalDimensions,
        Annotation[][] additionalAnnotations, boolean isVarargs) {
        int totalDimensions = this.dimensions() + additionalDimensions;
        Annotation[][] allAnnotations = getMergedAnnotationsOnDimensions(additionalDimensions, additionalAnnotations);
        ArrayTypeReference arrayTypeReference = new ArrayTypeReference(this.token, totalDimensions, allAnnotations,
            (((long) this.sourceStart) << 32) + this.sourceEnd);
        arrayTypeReference.annotations = this.annotations;
        arrayTypeReference.bits |= (this.bits & 1048576);
        if (!isVarargs)
            arrayTypeReference.extendedDimensions = additionalDimensions;
        return arrayTypeReference;
    }

    @Override
    public char[] getLastToken() {
        return this.token;
    }

    @Override
    public char[][] getTypeName() {
        return new char[][] { this.token };
    }

    @Override
    public boolean isBaseTypeReference() {
        return this.token == BYTE
            || this.token == SHORT
            || this.token == INT
            || this.token == LONG
            || this.token == FLOAT
            || this.token == DOUBLE
            || this.token == CHAR
            || this.token == BOOLEAN
            || this.token == NULL
            || this.token == VOID;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        if (this.annotations != null && this.annotations[0] != null) {
            printAnnotations(this.annotations[0], output);
            output.append(' ');
        }
        return output.append(this.token);
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        if (visitor.visit(this)) {
            if (this.annotations != null) {
                Annotation[] typeAnnotations = this.annotations[0];
                for (int i = 0, length = typeAnnotations == null ? 0 : typeAnnotations.length; i < length; i++)
                    typeAnnotations[i].traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.annotations != null) {
                Annotation[] typeAnnotations = this.annotations[0];
                for (int i = 0, length = typeAnnotations == null ? 0 : typeAnnotations.length; i < length; i++)
                    typeAnnotations[i].traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
