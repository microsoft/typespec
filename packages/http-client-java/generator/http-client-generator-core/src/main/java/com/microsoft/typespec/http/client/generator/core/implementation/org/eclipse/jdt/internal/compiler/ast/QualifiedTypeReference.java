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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class QualifiedTypeReference extends TypeReference {

    public char[][] tokens;
    public long[] sourcePositions;

    public QualifiedTypeReference(char[][] sources, long[] poss) {
        this.tokens = sources;
        this.sourcePositions = poss;
        this.sourceStart = (int) (this.sourcePositions[0] >>> 32);
        this.sourceEnd = (int) (this.sourcePositions[this.sourcePositions.length - 1] & 0x00000000FFFFFFFFL);
    }

    @Override
    public TypeReference augmentTypeWithAdditionalDimensions(int additionalDimensions,
        Annotation[][] additionalAnnotations, boolean isVarargs) {
        int totalDimensions = this.dimensions() + additionalDimensions;
        Annotation[][] allAnnotations = getMergedAnnotationsOnDimensions(additionalDimensions, additionalAnnotations);
        ArrayQualifiedTypeReference arrayQualifiedTypeReference
            = new ArrayQualifiedTypeReference(this.tokens, totalDimensions, allAnnotations, this.sourcePositions);
        arrayQualifiedTypeReference.annotations = this.annotations;
        arrayQualifiedTypeReference.bits |= (this.bits & 1048576);
        if (!isVarargs)
            arrayQualifiedTypeReference.extendedDimensions = additionalDimensions;
        return arrayQualifiedTypeReference;
    }

    @Override
    public char[] getLastToken() {
        return this.tokens[this.tokens.length - 1];
    }

    @Override
    public char[][] getTypeName() {
        return this.tokens;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        for (int i = 0; i < this.tokens.length; i++) {
            if (i > 0)
                output.append('.');
            if (this.annotations != null && this.annotations[i] != null) {
                printAnnotations(this.annotations[i], output);
                output.append(' ');
            }
            output.append(this.tokens[i]);
        }
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        if (visitor.visit(this)) {
            if (this.annotations != null) {
                int annotationsLevels = this.annotations.length;
                for (int i = 0; i < annotationsLevels; i++) {
                    int annotationsLength = this.annotations[i] == null ? 0 : this.annotations[i].length;
                    for (int j = 0; j < annotationsLength; j++)
                        this.annotations[i][j].traverse(visitor, scope);
                }
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.annotations != null) {
                int annotationsLevels = this.annotations.length;
                for (int i = 0; i < annotationsLevels; i++) {
                    int annotationsLength = this.annotations[i] == null ? 0 : this.annotations[i].length;
                    for (int j = 0; j < annotationsLength; j++)
                        this.annotations[i][j].traverse(visitor);
                }
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public int getAnnotatableLevels() {
        return this.tokens.length;
    }
}
