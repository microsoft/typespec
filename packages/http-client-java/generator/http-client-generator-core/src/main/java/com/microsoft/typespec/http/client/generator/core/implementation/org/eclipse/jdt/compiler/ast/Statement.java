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
 *								bug 335093 - [compiler][null] minimal hook for future null annotation support
 *								bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 365983 - [compiler][null] AIOOB with null annotation analysis and varargs
 *								bug 368546 - [compiler][resource] Avoid remaining false positives found when compiling the Eclipse SDK
 *								bug 370930 - NonNull annotation not considered for enhanced for loops
 *								bug 365859 - [compiler][null] distinguish warnings based on flow analysis vs. null annotations
 *								bug 392862 - [1.8][compiler][null] Evaluate null annotations on array types
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *								Bug 415291 - [1.8][null] differentiate type incompatibilities due to null annotations
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 416307 - [1.8][compiler][null] subclass with type parameter substitution confuses null checking
 *								Bug 417758 - [1.8][null] Null safety compromise during array creation.
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 424415 - [1.8][compiler] Eventual resolution of ReferenceExpression is not seen to be happening.
 *								Bug 418537 - [1.8][null] Fix null type annotation analysis for poly conditional expressions
 *								Bug 428352 - [1.8][compiler] Resolution errors don't always surface
 *								Bug 429430 - [1.8] Lambdas and method reference infer wrong exception type with generics (RuntimeException instead of IOException)
 *								Bug 435805 - [1.8][compiler][null] Java 8 compiler does not recognize declaration style null annotations
 *								Bug 453483 - [compiler][null][loop] Improve null analysis for loops
 *								Bug 455723 - Nonnull argument not correctly inferred in loop
 *        Andy Clement - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *                          Bug 409250 - [1.8][compiler] Various loose ends in 308 code generation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public abstract class Statement extends ASTNode {

    // for switch statement
    public boolean isTrulyExpression() {
        return false;
    }
}
