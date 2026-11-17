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
 *								Bug 435570 - [1.8][null] @NonNullByDefault illegally tries to affect "throws E"
 *								Bug 466713 - Null Annotations: NullPointerException using <int @Nullable []> as Type Param
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class ArrayTypeReference extends SingleTypeReference {
    public int dimensions;
    private Annotation[][] annotationsOnDimensions; // jsr308 style type annotations on dimensions.

    public int extendedDimensions;

    /**
     * ArrayTypeReference constructor comment.
     *
     * @param source char[]
     * @param dimensions int
     * @param pos int
     */
    public ArrayTypeReference(char[] source, int dimensions, long pos) {
        super(source, pos);

        this.dimensions = dimensions;
        this.annotationsOnDimensions = null;
    }

    public ArrayTypeReference(char[] source, int dimensions, Annotation[][] annotationsOnDimensions, long pos) {
        this(source, dimensions, pos);
        if (annotationsOnDimensions != null) {
            this.bits |= 1048576;
        }
        this.annotationsOnDimensions = annotationsOnDimensions;
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
