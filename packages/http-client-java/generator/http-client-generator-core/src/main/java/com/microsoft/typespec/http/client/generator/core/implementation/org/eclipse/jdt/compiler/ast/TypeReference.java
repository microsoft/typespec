// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2020 IBM Corporation and others.
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
 *								bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								bug 392862 - [1.8][compiler][null] Evaluate null annotations on array types
 *								bug 392384 - [1.8][compiler][null] Restore nullness info from type annotations in class files
 *								Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *								Bug 415850 - [1.8] Ensure RunJDTCoreTests can cope with null annotations enabled
 *								Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *								Bug 427163 - [1.8][null] bogus error "Contradictory null specification" on varags
 *								Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *								Bug 434570 - Generic type mismatch for parametrized class annotation attribute with inner class
 *								Bug 434600 - Incorrect null analysis error reporting on type parameters
 *								Bug 439516 - [1.8][null] NonNullByDefault wrongly applied to implicit type bound of binary type
 *								Bug 438458 - [1.8][null] clean up handling of null type annotations wrt type variables
 *								Bug 435570 - [1.8][null] @NonNullByDefault illegally tries to affect "throws E"
 *								Bug 435805 - [1.8][compiler][null] Java 8 compiler does not recognize declaration style null annotations
 *								Bug 437072 - [compiler][null] Null analysis emits possibly incorrect warning for new int[][] despite @NonNullByDefault
 *								Bug 466713 - Null Annotations: NullPointerException using <int @Nullable []> as Type Param
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *                          Bug 409236 - [1.8][compiler] Type annotations on intersection cast types dropped by code generator
 *                          Bug 415399 - [1.8][compiler] Type annotations on constructor results dropped by the code generator
 *      Jesper S Møller <jesper@selskabet.org> -  Contributions for
 *                          bug 527554 - [18.3] Compiler support for JEP 286 Local-Variable Type
 *                          bug 529556 - [18.3] Add content assist support for 'var' as a type
 *
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.*;

@SuppressWarnings({ })
public abstract class TypeReference extends Expression {
    public static final TypeReference[] NO_TYPE_ARGUMENTS = new TypeReference[0];

    /*
     * Answer a base type reference (can be an array of base type).
     */
    public static TypeReference baseTypeReference(int baseType, int dim, Annotation[][] dimAnnotations) {
        if (dim == 0) {
            return switch (baseType) {
                case (6) -> new SingleTypeReference(TypeConstants.VOID, 0);
                case (5) -> new SingleTypeReference(TypeConstants.BOOLEAN, 0);
                case (2) -> new SingleTypeReference(TypeConstants.CHAR, 0);
                case (9) -> new SingleTypeReference(TypeConstants.FLOAT, 0);
                case (8) -> new SingleTypeReference(TypeConstants.DOUBLE, 0);
                case (3) -> new SingleTypeReference(TypeConstants.BYTE, 0);
                case (4) -> new SingleTypeReference(TypeConstants.SHORT, 0);
                case (10) -> new SingleTypeReference(TypeConstants.INT, 0);
                default -> // long
                    new SingleTypeReference(TypeConstants.LONG, 0);
            };
        }
        return switch (baseType) {
            case (6) -> new ArrayTypeReference(TypeConstants.VOID, dim, dimAnnotations, 0);
            case (5) -> new ArrayTypeReference(TypeConstants.BOOLEAN, dim, dimAnnotations, 0);
            case (2) -> new ArrayTypeReference(TypeConstants.CHAR, dim, dimAnnotations, 0);
            case (9) -> new ArrayTypeReference(TypeConstants.FLOAT, dim, dimAnnotations, 0);
            case (8) -> new ArrayTypeReference(TypeConstants.DOUBLE, dim, dimAnnotations, 0);
            case (3) -> new ArrayTypeReference(TypeConstants.BYTE, dim, dimAnnotations, 0);
            case (4) -> new ArrayTypeReference(TypeConstants.SHORT, dim, dimAnnotations, 0);
            case (10) -> new ArrayTypeReference(TypeConstants.INT, dim, dimAnnotations, 0);
            default -> // long
                new ArrayTypeReference(TypeConstants.LONG, dim, dimAnnotations, 0);
        };
    }

// JSR308 type annotations...
    public Annotation[][] annotations = null;

    public abstract TypeReference augmentTypeWithAdditionalDimensions(int additionalDimensions,
        Annotation[][] additionalAnnotations, boolean isVarargs);

    protected Annotation[][] getMergedAnnotationsOnDimensions(int additionalDimensions,
        Annotation[][] additionalAnnotations) {
        /*
         * Note, we actually concatenate the additional annotations after base annotations, in bindings, they should
         * appear before base annotations. Given @English int @Nullable [] x @NonNull []; the type x is a @NonNull
         * arrays of of @Nullable arrays of @English Strings, not the other way about. Changing this in the compiler AST
         * representation will cause too many ripples, so we leave it as is. On the bindings, the type will reflect
         * rotated (i.e will reflect correctly).
         */
        Annotation[][] annotationsOnDimensions = this.getAnnotationsOnDimensions();
        int dimensions = this.dimensions();

        if (annotationsOnDimensions == null && additionalAnnotations == null)
            return null;

        final int totalDimensions = dimensions + additionalDimensions;
        Annotation[][] mergedAnnotations = new Annotation[totalDimensions][];
        if (annotationsOnDimensions != null) {
            System.arraycopy(annotationsOnDimensions, 0, mergedAnnotations, 0, dimensions);
        }
        if (additionalAnnotations != null) {
            for (int i = dimensions, j = 0; i < totalDimensions; i++, j++) {
                mergedAnnotations[i] = additionalAnnotations[j];
            }
        }
        return mergedAnnotations;
    }

    public int dimensions() {
        return 0;
    }

    /**
     * This method is used to return the array dimension declared after the name of a local or a field declaration. For
     * example: int i, j[] = null, k[][] = {{}}; It should return 0 for i, 1 for j and 2 for k.
     *
     * @return int the extra dimension found
     */
    public int extraDimensions() {
        return 0;
    }

    /**
     */
    public Annotation[][] getAnnotationsOnDimensions() {
        return null;
    }

    public void setAnnotationsOnDimensions(Annotation[][] annotationsOnDimensions) {
        // nothing to do. Subtypes should react suitably.
    }

    /**
     * @return char[][]
     */
    public abstract char[][] getTypeName();

    public boolean isParameterizedTypeReference() {
        return false;
    }

    public int getAnnotatableLevels() {
        return 1;
    }

}
