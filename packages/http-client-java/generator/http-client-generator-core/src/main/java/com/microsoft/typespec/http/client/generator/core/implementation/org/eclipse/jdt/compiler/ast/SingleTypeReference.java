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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

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
    public char[][] getTypeName() {
        return new char[][] { this.token };
    }

}
