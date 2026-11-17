// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2017 IBM Corporation and others.
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
 *								Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class ArrayQualifiedTypeReference extends QualifiedTypeReference {
    int dimensions;
    private Annotation[][] annotationsOnDimensions;  // jsr308 style type annotations on dimensions
    public int extendedDimensions;

    public ArrayQualifiedTypeReference(char[][] sources, int dim, long[] poss) {
        super(sources, poss);
        this.dimensions = dim;
        this.annotationsOnDimensions = null;
    }

    public ArrayQualifiedTypeReference(char[][] sources, int dim, Annotation[][] annotationsOnDimensions, long[] poss) {
        this(sources, dim, poss);
        this.annotationsOnDimensions = annotationsOnDimensions;
        if (annotationsOnDimensions != null)
            this.bits |= 1048576;
    }

    @Override
    public int dimensions() {
        return this.dimensions;
    }

    @Override
    public int extraDimensions() {
        return this.extendedDimensions;
    }

    /**
     */
    @Override
    public Annotation[][] getAnnotationsOnDimensions() {
        return this.annotationsOnDimensions;
    }

    @Override
    public void setAnnotationsOnDimensions(Annotation[][] annotationsOnDimensions) {
        this.annotationsOnDimensions = annotationsOnDimensions;
    }

}
