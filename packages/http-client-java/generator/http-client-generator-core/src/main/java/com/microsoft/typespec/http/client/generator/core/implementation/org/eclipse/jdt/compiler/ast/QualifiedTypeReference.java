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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

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
    public char[][] getTypeName() {
        return this.tokens;
    }

    @Override
    public int getAnnotatableLevels() {
        return this.tokens.length;
    }
}
