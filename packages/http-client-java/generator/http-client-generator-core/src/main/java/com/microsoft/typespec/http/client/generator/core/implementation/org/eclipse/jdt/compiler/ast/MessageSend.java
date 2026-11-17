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
 *     Nick Teryaev - fix for bug (https://bugs.eclipse.org/bugs/show_bug.cgi?id=40752)
 *     Stephan Herrmann - Contributions for
 *								bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 *								bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 358903 - Filter practically unimportant resource leak warnings
 *								bug 370639 - [compiler][resource] restore the default for resource leak warnings
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 388996 - [compiler][resource] Incorrect 'potential resource leak'
 *								bug 379784 - [compiler] "Method can be static" is not getting reported
 *								bug 379834 - Wrong "method can be static" in presence of qualified super and different staticness of nested super class.
 *								bug 388281 - [compiler][null] inheritance of null annotations as an option
 *								bug 392862 - [1.8][compiler][null] Evaluate null annotations on array types
 *								bug 394768 - [compiler][resource] Incorrect resource leak warning when creating stream in conditional
 *								bug 381445 - [compiler][resource] Can the resource leak check be made aware of Closeables.closeQuietly?
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								bug 382069 - [null] Make the null analysis consider JUnit's assertNotNull similarly to assertions
 *								bug 382350 - [1.8][compiler] Unable to invoke inherited default method via I.super.m() syntax
 *								bug 404649 - [1.8][compiler] detect illegal reference to indirect or redundant super
 *								bug 403086 - [compiler][null] include the effect of 'assert' in syntactic null analysis for fields
 *								bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *								Bug 405569 - Resource leak check false positive when using DbUtils.closeQuietly
 *								Bug 411964 - [1.8][null] leverage null type annotation in foreach statement
 *								Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 423504 - [1.8] Implement "18.5.3 Functional Interface Parameterization Inference"
 *								Bug 424710 - [1.8][compiler] CCE in SingleNameReference.localVariableBinding
 *								Bug 425152 - [1.8] [compiler] Lambda Expression not resolved but flow analyzed leading to NPE.
 *								Bug 424205 - [1.8] Cannot infer type for diamond type with lambda on method invocation
 *								Bug 424415 - [1.8][compiler] Eventual resolution of ReferenceExpression is not seen to be happening.
 *								Bug 426366 - [1.8][compiler] Type inference doesn't handle multiple candidate target types in outer overload context
 *								Bug 426290 - [1.8][compiler] Inference + overloading => wrong method resolution ?
 *								Bug 427483 - [Java 8] Variables in lambdas sometimes can't be resolved
 *								Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *								Bug 426996 - [1.8][inference] try to avoid method Expression.unresolve()?
 *								Bug 428352 - [1.8][compiler] Resolution errors don't always surface
 *								Bug 429430 - [1.8] Lambdas and method reference infer wrong exception type with generics (RuntimeException instead of IOException)
 *								Bug 441734 - [1.8][inference] Generic method with nested parameterized type argument fails on method reference
 *								Bug 452788 - [1.8][compiler] Type not correctly inferred in lambda expression
 *								Bug 456487 - [1.8][null] @Nullable type variant of @NonNull-constrained type parameter causes grief
 *								Bug 407414 - [compiler][null] Incorrect warning on a primitive type being null
 *								Bug 472618 - [compiler][null] assertNotNull vs. Assert.assertNotNull
 *								Bug 470958 - [1.8] Unable to convert lambda
 *								Bug 410218 - Optional warning for arguments of "unexpected" types to Map#get(Object), Collection#remove(Object) et al.
 *     Jesper S Moller - Contributions for
 *								Bug 378674 - "The method can be declared as static" is wrong
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *                          Bug 409245 - [1.8][compiler] Type annotations dropped when call is routed through a synthetic bridge method
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class MessageSend extends Expression {

    public Expression receiver;
    public char[] selector;
    public Expression[] arguments;

    public long nameSourcePosition; // (start<<32)+end

    public TypeReference[] typeArguments;

    public boolean isSuperAccess() {
        return this.receiver.isSuper();
    }

}
