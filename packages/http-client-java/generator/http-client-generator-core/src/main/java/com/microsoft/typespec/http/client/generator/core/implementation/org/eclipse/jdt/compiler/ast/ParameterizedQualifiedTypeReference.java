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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

/**
 * Syntactic representation of a reference to a generic type. Note that it might also have a dimension.
 */
public class ParameterizedQualifiedTypeReference extends ArrayQualifiedTypeReference {

    public TypeReference[][] typeArguments;

    public ParameterizedQualifiedTypeReference(char[][] tokens, TypeReference[][] typeArguments, int dim,
        long[] positions) {
        super(tokens, dim, positions);
        this.typeArguments = typeArguments;
        annotationSearch: for (TypeReference[] typeArgumentsOnTypeComponent : typeArguments) {
            if (typeArgumentsOnTypeComponent != null) {
                for (TypeReference typeReference : typeArgumentsOnTypeComponent) {
                    if ((typeReference.bits & 1048576) != 0) {
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

}
