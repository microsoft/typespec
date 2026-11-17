// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2021 IBM Corporation and others.
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
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 365662 - [compiler][null] warn on contradictory and redundant null annotations
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 415850 - [1.8] Ensure RunJDTCoreTests can cope with null annotations enabled
 *								Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *								Bug 424728 - [1.8][null] Unexpected error: The nullness annotation 'XXXX' is not applicable at this location
 *								Bug 392245 - [1.8][compiler][null] Define whether / how @NonNullByDefault applies to TYPE_USE locations
 *								Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *								Bug 435805 - [1.8][compiler][null] Java 8 compiler does not recognize declaration style null annotations
 *								Bug 457210 - [1.8][compiler][null] Wrong Nullness errors given on full build build but not on incremental build?
 *								Bug 469584 - ClassCastException in Annotation.detectStandardAnnotation (320)
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *                          Bug 409517 - [1.8][compiler] Type annotation problems on more elaborate array references
 *                          Bug 415397 - [1.8][compiler] Type Annotations on wildcard type argument dropped
 *                          Bug 414384 - [1.8] type annotation on abbreviated inner class is not marked as inner type
 *      Jesper S Moller <jesper@selskabet.org> -  Contributions for
 *                          Bug 412153 - [1.8][compiler] Check validity of annotations which may be repeatable
 *                          Bug 412151 - [1.8][compiler] Check repeating annotation's collection type
 *                          Bug 412149 - [1.8][compiler] Emit repeated annotations into the designated container
 *                          Bug 419209 - [1.8] Repeating container annotations should be rejected in the presence of annotation it contains
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

/**
 * Annotation
 */
public abstract class Annotation extends Expression {

    public int declarationSourceEnd;

    public TypeReference type;

}
