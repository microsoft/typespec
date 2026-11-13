// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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
 *	 							bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 387612 - Unreachable catch block...exception is never thrown from the try
 *								bug 395002 - Self bound generic class doesn't resolve bounds properly for wildcards for certain parametrisation.
 *								bug 401456 - Code compiles from javac/intellij, but fails from eclipse
 *								bug 401271 - StackOverflowError when searching for a methods references
 *								bug 405706 - Eclipse compiler fails to give compiler error when return type is a inferred generic
 *								Bug 408441 - Type mismatch using Arrays.asList with 3 or more implementations of an interface with the interface type as the last parameter
 *								Bug 413958 - Function override returning inherited Generic Type
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 416183 - [1.8][compiler][null] Overload resolution fails with null annotations
 *								Bug 416176 - [1.8][compiler][null] null type annotations cause grief on type variables
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 424710 - [1.8][compiler] CCE in SingleNameReference.localVariableBinding
 *								Bug 424205 - [1.8] Cannot infer type for diamond type with lambda on method invocation
 *								Bug 424415 - [1.8][compiler] Eventual resolution of ReferenceExpression is not seen to be happening.
 *								Bug 426366 - [1.8][compiler] Type inference doesn't handle multiple candidate target types in outer overload context
 *								Bug 426290 - [1.8][compiler] Inference + overloading => wrong method resolution ?
 *								Bug 426589 - [1.8][compiler] Compiler error with generic method/constructor invocation as vargs argument
 *								Bug 426590 - [1.8][compiler] Compiler error with tenary operator
 *								Bug 426764 - [1.8] Presence of conditional expression as method argument confuses compiler
 *								Bug 426998 - [1.8][compiler] method(java.lang.Class, java.lang.String) not applicable for the arguments (java.lang.Class, java.lang.String)
 *								Bug 423505 - [1.8] Implement "18.5.4 More Specific Method Inference"
 *								Bug 427196 - [1.8][compiler] Compiler error for method reference to overloaded method
 *								Bug 427483 - [Java 8] Variables in lambdas sometimes can't be resolved
 *								Bug 427728 - [1.8] Type Inference rejects calls requiring boxing/unboxing
 *								Bug 427218 - [1.8][compiler] Verify error varargs + inference
 *								Bug 426836 - [1.8] special handling for return type in references to method getClass()?
 *								Bug 427628 - [1.8] regression : The method * is ambiguous for the type *
 *								Bug 428352 - [1.8][compiler] Resolution errors don't always surface
 *								Bug 428366 - [1.8] [compiler] The method valueAt(ObservableList<Object>, int) is ambiguous for the type Bindings
 *								Bug 424728 - [1.8][null] Unexpected error: The nullness annotation 'XXXX' is not applicable at this location
 *								Bug 428811 - [1.8][compiler] Type witness unnecessarily required
 *								Bug 429424 - [1.8][inference] Problem inferring type of method's parameter
 *								Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *								Bug 434570 - Generic type mismatch for parametrized class annotation attribute with inner class
 *								Bug 434483 - [1.8][compiler][inference] Type inference not picked up with method reference
 *								Bug 441734 - [1.8][inference] Generic method with nested parameterized type argument fails on method reference
 *								Bug 452194 - Code no longer compiles in 4.4.1, but with confusing error
 *								Bug 452788 - [1.8][compiler] Type not correctly inferred in lambda expression
 *								Bug 456236 - [1.8][null] Cannot infer type when constructor argument is annotated with @Nullable
 *								Bug 437072 - [compiler][null] Null analysis emits possibly incorrect warning for new int[][] despite @NonNullByDefault
 *								Bug 462083 - [1.8][inference] Java 8 generic return type mismatch with interface involving type parameter.
 *     Jesper S Moller - Contributions for
 *								Bug 378674 - "The method can be declared as static" is wrong
 *  							Bug 405066 - [1.8][compiler][codegen] Implement code generation infrastructure for JSR335
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          	Bug 405104 - [1.8][compiler][codegen] Implement support for serializeable lambdas
 *     Pierre-Yves B. <pyvesdev@gmail.com> - Contributions for
 *                              Bug 559618 - No compiler warning for import from same package
 *                              Bug 560630 - No warning on unused import on class from same package
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CompilationUnitDeclaration;

public abstract class Scope {

    public Scope parent;

    public abstract CompilationUnitDeclaration referenceCompilationUnit();

}
