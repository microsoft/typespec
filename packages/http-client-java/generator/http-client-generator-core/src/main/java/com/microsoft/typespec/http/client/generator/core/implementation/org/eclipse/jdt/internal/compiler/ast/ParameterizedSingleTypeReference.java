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
 *     Stephan Herrmann - Contributions for
 *								bug 342671 - ClassCastException: org.eclipse.jdt.internal.compiler.lookup.SourceTypeBinding cannot be cast to org.eclipse.jdt.internal.compiler.lookup.ArrayBinding
 *								Bug 420894 - ClassCastException in DefaultBindingResolver.resolveType(Type)
 *								bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *								Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *								Bug 434600 - Incorrect null analysis error reporting on type parameters
 *								Bug 435570 - [1.8][null] @NonNullByDefault illegally tries to affect "throws E"
 *								Bug 456508 - Unexpected RHS PolyTypeBinding for: <code-snippet>
 *								Bug 466713 - Null Annotations: NullPointerException using <int @Nullable []> as Type Param
 *        Andy Clement - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;

/**
 * Syntactic representation of a reference to a generic type. Note that it might also have a dimension.
 */
public class ParameterizedSingleTypeReference extends ArrayTypeReference {

    public TypeReference[] typeArguments;

    public ParameterizedSingleTypeReference(char[] name, TypeReference[] typeArguments, int dim, long pos) {
        super(name, dim, pos);

        this.typeArguments = typeArguments;
        for (TypeReference typeArgument : typeArguments) {
            if ((typeArgument.bits & 1048576) != 0) {
                this.bits |= 1048576;
                break;
            }
        }
    }

    public ParameterizedSingleTypeReference(char[] name, TypeReference[] typeArguments, int dim,
        Annotation[][] annotationsOnDimensions, long pos) {
        this(name, typeArguments, dim, pos);
        setAnnotationsOnDimensions(annotationsOnDimensions);
        if (annotationsOnDimensions != null) {
            this.bits |= 1048576;
        }
    }

    @Override
    public TypeReference augmentTypeWithAdditionalDimensions(int additionalDimensions,
        Annotation[][] additionalAnnotations, boolean isVarargs) {
        int totalDimensions = this.dimensions() + additionalDimensions;
        Annotation[][] allAnnotations = getMergedAnnotationsOnDimensions(additionalDimensions, additionalAnnotations);
        ParameterizedSingleTypeReference parameterizedSingleTypeReference
            = new ParameterizedSingleTypeReference(this.token, this.typeArguments, totalDimensions, allAnnotations,
                (((long) this.sourceStart) << 32) + this.sourceEnd);
        parameterizedSingleTypeReference.annotations = this.annotations;
        parameterizedSingleTypeReference.bits |= (this.bits & 1048576);
        if (!isVarargs)
            parameterizedSingleTypeReference.extendedDimensions = additionalDimensions;
        return parameterizedSingleTypeReference;
    }

    @Override
    public boolean isParameterizedTypeReference() {
        return true;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        if (this.annotations != null && this.annotations[0] != null) {
            printAnnotations(this.annotations[0], output);
            output.append(' ');
        }
        output.append(this.token);
        output.append("<"); //$NON-NLS-1$
        int length = this.typeArguments.length;
        if (length > 0) {
            int max = length - 1;
            for (int i = 0; i < max; i++) {
                this.typeArguments[i].print(0, output);
                output.append(", ");//$NON-NLS-1$
            }
            this.typeArguments[max].print(0, output);
        }
        output.append(">"); //$NON-NLS-1$
        Annotation[][] annotationsOnDimensions = getAnnotationsOnDimensions();
        if ((this.bits & 16384) != 0) {
            for (int i = 0; i < this.dimensions - 1; i++) {
                if (annotationsOnDimensions != null && annotationsOnDimensions[i] != null) {
                    output.append(" "); //$NON-NLS-1$
                    printAnnotations(annotationsOnDimensions[i], output);
                    output.append(" "); //$NON-NLS-1$
                }
                output.append("[]"); //$NON-NLS-1$
            }
            if (annotationsOnDimensions != null && annotationsOnDimensions[this.dimensions - 1] != null) {
                output.append(" "); //$NON-NLS-1$
                printAnnotations(annotationsOnDimensions[this.dimensions - 1], output);
                output.append(" "); //$NON-NLS-1$
            }
            output.append("..."); //$NON-NLS-1$
        } else {
            for (int i = 0; i < this.dimensions; i++) {
                if (annotationsOnDimensions != null && annotationsOnDimensions[i] != null) {
                    output.append(" "); //$NON-NLS-1$
                    printAnnotations(annotationsOnDimensions[i], output);
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
                Annotation[] typeAnnotations = this.annotations[0];
                for (int i = 0, length = typeAnnotations == null ? 0 : typeAnnotations.length; i < length; i++) {
                    typeAnnotations[i].traverse(visitor, scope);
                }
            }
            Annotation[][] annotationsOnDimensions = getAnnotationsOnDimensions(true);
            if (annotationsOnDimensions != null) {
                for (Annotation[] annotationsOnDimension : annotationsOnDimensions) {
                    if (annotationsOnDimension != null) {
                        for (Annotation annotation : annotationsOnDimension) {
                            annotation.traverse(visitor, scope);
                        }
                    }
                }
            }
            for (TypeReference typeArgument : this.typeArguments) {
                typeArgument.traverse(visitor, scope);
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
                for (int i = 0, length = typeAnnotations == null ? 0 : typeAnnotations.length; i < length; i++) {
                    typeAnnotations[i].traverse(visitor);
                }
            }
            Annotation[][] annotationsOnDimensions = getAnnotationsOnDimensions(true);
            if (annotationsOnDimensions != null) {
                for (Annotation[] annotationsOnDimension : annotationsOnDimensions) {
                    for (Annotation annotation : annotationsOnDimension) {
                        annotation.traverse(visitor);
                    }
                }
            }
            for (TypeReference typeArgument : this.typeArguments) {
                typeArgument.traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
