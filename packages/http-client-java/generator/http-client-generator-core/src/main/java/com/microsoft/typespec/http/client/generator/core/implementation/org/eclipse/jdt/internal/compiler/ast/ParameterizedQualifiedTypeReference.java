// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2024 IBM Corporation and others.
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
 *								bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *								Bug 416181 - [1.8][compiler][null] Invalid assignment is not rejected by the compiler
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
public class ParameterizedQualifiedTypeReference extends ArrayQualifiedTypeReference {

    public TypeReference[][] typeArguments;

    public ParameterizedQualifiedTypeReference(char[][] tokens, TypeReference[][] typeArguments, int dim,
        long[] positions) {
        super(tokens, dim, positions);
        this.typeArguments = typeArguments;
        annotationSearch: for (int i = 0, max = typeArguments.length; i < max; i++) {
            TypeReference[] typeArgumentsOnTypeComponent = typeArguments[i];
            if (typeArgumentsOnTypeComponent != null) {
                for (int j = 0, max2 = typeArgumentsOnTypeComponent.length; j < max2; j++) {
                    if ((typeArgumentsOnTypeComponent[j].bits & 1048576) != 0) {
                        this.bits |= 1048576;
                        break annotationSearch;
                    }
                }
            }
        }
    }

    public ParameterizedQualifiedTypeReference(char[][] tokens, TypeReference[][] typeArguments, int dim,
        Annotation[][] annotationsOnDimensions, long[] positions) {
        this(tokens, typeArguments, dim, positions);
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
        ParameterizedQualifiedTypeReference pqtr = new ParameterizedQualifiedTypeReference(this.tokens,
            this.typeArguments, totalDimensions, allAnnotations, this.sourcePositions);
        pqtr.annotations = this.annotations;
        pqtr.bits |= (this.bits & 1048576);
        if (!isVarargs)
            pqtr.extendedDimensions = additionalDimensions;
        return pqtr;
    }

    @Override
    public boolean isParameterizedTypeReference() {
        return true;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        int length = this.tokens.length;
        for (int i = 0; i < length - 1; i++) {
            if (this.annotations != null && this.annotations[i] != null) {
                printAnnotations(this.annotations[i], output);
                output.append(' ');
            }
            output.append(this.tokens[i]);
            TypeReference[] typeArgument = this.typeArguments[i];
            if (typeArgument != null) {
                output.append('<');
                int typeArgumentLength = typeArgument.length;
                if (typeArgumentLength > 0) {
                    int max = typeArgumentLength - 1;
                    for (int j = 0; j < max; j++) {
                        typeArgument[j].print(0, output);
                        output.append(", ");//$NON-NLS-1$
                    }
                    typeArgument[max].print(0, output);
                }
                output.append('>');
            }
            output.append('.');
        }
        if (this.annotations != null && this.annotations[length - 1] != null) {
            output.append(" "); //$NON-NLS-1$
            printAnnotations(this.annotations[length - 1], output);
            output.append(' ');
        }
        output.append(this.tokens[length - 1]);
        TypeReference[] typeArgument = this.typeArguments[length - 1];
        if (typeArgument != null) {
            output.append('<');
            int typeArgumentLength = typeArgument.length;
            if (typeArgumentLength > 0) {
                int max = typeArgumentLength - 1;
                for (int j = 0; j < max; j++) {
                    typeArgument[j].print(0, output);
                    output.append(", ");//$NON-NLS-1$
                }
                typeArgument[max].print(0, output);
            }
            output.append('>');
        }
        Annotation[][] annotationsOnDimensions = this.getAnnotationsOnDimensions();
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
                int annotationsLevels = this.annotations.length;
                for (int i = 0; i < annotationsLevels; i++) {
                    int annotationsLength = this.annotations[i] == null ? 0 : this.annotations[i].length;
                    for (int j = 0; j < annotationsLength; j++)
                        this.annotations[i][j].traverse(visitor, scope);
                }
            }
            Annotation[][] annotationsOnDimensions = getAnnotationsOnDimensions(true);
            if (annotationsOnDimensions != null) {
                for (Annotation[] annotationsOnDimension : annotationsOnDimensions) {
                    for (int j = 0, max2 = annotationsOnDimension == null ? 0 : annotationsOnDimension.length; j < max2;
                        j++) {
                        Annotation annotation = annotationsOnDimension[j];
                        annotation.traverse(visitor, scope);
                    }
                }
            }
            for (TypeReference[] typeArgument : this.typeArguments) {
                if (typeArgument != null) {
                    for (TypeReference typeReference : typeArgument) {
                        typeReference.traverse(visitor, scope);
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
            Annotation[][] annotationsOnDimensions = getAnnotationsOnDimensions(true);
            if (annotationsOnDimensions != null) {
                for (Annotation[] annotationsOnDimension : annotationsOnDimensions) {
                    for (int j = 0, max2 = annotationsOnDimension == null ? 0 : annotationsOnDimension.length; j < max2;
                        j++) {
                        Annotation annotation = annotationsOnDimension[j];
                        annotation.traverse(visitor);
                    }
                }
            }
            for (TypeReference[] typeArgument : this.typeArguments) {
                if (typeArgument != null) {
                    for (TypeReference argument : typeArgument) {
                        argument.traverse(visitor);
                    }
                }
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
