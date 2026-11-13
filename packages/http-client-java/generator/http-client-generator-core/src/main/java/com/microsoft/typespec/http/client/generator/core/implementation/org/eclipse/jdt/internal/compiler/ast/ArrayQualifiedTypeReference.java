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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

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
    public Annotation[][] getAnnotationsOnDimensions(boolean useSourceOrder) {
        if (useSourceOrder
            || this.annotationsOnDimensions == null
            || this.annotationsOnDimensions.length == 0
            || this.extendedDimensions == 0
            || this.extendedDimensions == this.dimensions)
            return this.annotationsOnDimensions;
        Annotation[][] externalAnnotations = new Annotation[this.dimensions][];
        final int baseDimensions = this.dimensions - this.extendedDimensions;
        System.arraycopy(this.annotationsOnDimensions, baseDimensions, externalAnnotations, 0, this.extendedDimensions);
        System.arraycopy(this.annotationsOnDimensions, 0, externalAnnotations, this.extendedDimensions, baseDimensions);
        return externalAnnotations;
    }

    @Override
    public void setAnnotationsOnDimensions(Annotation[][] annotationsOnDimensions) {
        this.annotationsOnDimensions = annotationsOnDimensions;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        super.printExpression(indent, output);
        if ((this.bits & 16384) != 0) {
            for (int i = 0; i < this.dimensions - 1; i++) {
                if (this.annotationsOnDimensions != null && this.annotationsOnDimensions[i] != null) {
                    output.append(' ');
                    printAnnotations(this.annotationsOnDimensions[i], output);
                    output.append(' ');
                }
                output.append("[]"); //$NON-NLS-1$
            }
            if (this.annotationsOnDimensions != null && this.annotationsOnDimensions[this.dimensions - 1] != null) {
                output.append(' ');
                printAnnotations(this.annotationsOnDimensions[this.dimensions - 1], output);
                output.append(' ');
            }
            output.append("..."); //$NON-NLS-1$
        } else {
            for (int i = 0; i < this.dimensions; i++) {
                if (this.annotationsOnDimensions != null && this.annotationsOnDimensions[i] != null) {
                    output.append(" "); //$NON-NLS-1$
                    printAnnotations(this.annotationsOnDimensions[i], output);
                    output.append(" "); //$NON-NLS-1$
                }
                output.append("[]"); //$NON-NLS-1$
            }
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
            if (this.annotationsOnDimensions != null) {
                for (Annotation[] annotationsOnDimension : this.annotationsOnDimensions) {
                    for (int j = 0, max2 = annotationsOnDimension == null ? 0 : annotationsOnDimension.length; j < max2;
                        j++) {
                        Annotation annotation = annotationsOnDimension[j];
                        annotation.traverse(visitor, scope);
                    }
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
            if (this.annotationsOnDimensions != null) {
                for (Annotation[] annotationsOnDimension : this.annotationsOnDimensions) {
                    for (int j = 0, max2 = annotationsOnDimension == null ? 0 : annotationsOnDimension.length; j < max2;
                        j++) {
                        Annotation annotation = annotationsOnDimension[j];
                        annotation.traverse(visitor);
                    }
                }
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
