// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
 *     Jesper S Moller - Contributions for
 *							bug 382701 - [1.8][compiler] Implement semantic analysis of Lambda expressions & Reference expression
 *                          Bug 384687 - [1.8] Wildcard type arguments should be rejected for lambda and reference expressions
 *							Bug 416885 - [1.8][compiler]IncompatibleClassChange error (edit)
 *	   Stephan Herrmann - Contribution for
 *							bug 402028 - [1.8][compiler] null analysis for reference expressions
 *							bug 404649 - [1.8][compiler] detect illegal reference to indirect or redundant super via I.super.m() syntax
 *							Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *							Bug 415850 - [1.8] Ensure RunJDTCoreTests can cope with null annotations enabled
 *							Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *							Bug 423504 - [1.8] Implement "18.5.3 Functional Interface Parameterization Inference"
 *							Bug 424637 - [1.8][compiler][null] AIOOB in ReferenceExpression.resolveType with a method reference to Files::walk
 *							Bug 424415 - [1.8][compiler] Eventual resolution of ReferenceExpression is not seen to be happening.
 *							Bug 424403 - [1.8][compiler] Generic method call with method reference argument fails to resolve properly.
 *							Bug 427196 - [1.8][compiler] Compiler error for method reference to overloaded method
 *							Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *							Bug 428264 - [1.8] method reference of generic class causes problems (wrong inference result or NPE)
 *							Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *							Bug 426537 - [1.8][inference] Eclipse compiler thinks I<? super J> is compatible with I<J<?>> - raw type J involved
 *							Bug 435570 - [1.8][null] @NonNullByDefault illegally tries to affect "throws E"
 *							Bug 435689 - [1.8][inference] Type inference not occurring with lambda expression and method reference
 *							Bug 438383 - [1.8][null] Bogus warning: Null type safety at method return type
 *							Bug 434483 - [1.8][compiler][inference] Type inference not picked up with method reference
 *							Bug 441734 - [1.8][inference] Generic method with nested parameterized type argument fails on method reference
 *							Bug 438945 - [1.8] NullPointerException InferenceContext18.checkExpression in java 8 with generics, primitives, and overloading
 *							Bug 452788 - [1.8][compiler] Type not correctly inferred in lambda expression
 *							Bug 448709 - [1.8][null] ensure we don't infer types that violate null constraints on a type parameter's bound
 *							Bug 459967 - [null] compiler should know about nullness of special methods like MyEnum.valueOf()
 *							Bug 466713 - Null Annotations: NullPointerException using <int @Nullable []> as Type Param
 *							Bug 470542 - NullPointerException in ReferenceExpression.isPotentiallyCompatibleWith (962)
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contribution for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.classfmt.ClassFileConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class ReferenceExpression extends FunctionalExpression {

    public Expression lhs;
    public TypeReference[] typeArguments;
    public char[] selector;

    public ReferenceExpression() {
        super();

    }

    public void initialize(CompilationResult result, Expression expression, TypeReference[] optionalTypeArguments,
        char[] identifierOrNew, int sourceEndPosition) {
        super.setCompilationResult(result);
        this.lhs = expression;
        this.typeArguments = optionalTypeArguments;
        this.selector = identifierOrNew;
        this.sourceStart = expression.sourceStart;
        this.sourceEnd = sourceEndPosition;
    }

    public boolean isConstructorReference() {
        return CharOperation.equals(this.selector, ClassFileConstants.Init);
    }

    @Override
    public StringBuilder printExpression(int tab, StringBuilder output) {
        this.lhs.print(0, output);
        output.append("::"); //$NON-NLS-1$
        if (this.typeArguments != null) {
            output.append('<');
            int max = this.typeArguments.length - 1;
            for (int j = 0; j < max; j++) {
                this.typeArguments[j].print(0, output);
                output.append(", ");//$NON-NLS-1$
            }
            this.typeArguments[max].print(0, output);
            output.append('>');
        }
        if (isConstructorReference())
            output.append("new"); //$NON-NLS-1$
        else
            output.append(this.selector);

        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        {
            java.util.Objects.requireNonNull(visitor);

            this.lhs.traverse(visitor, blockScope);

            int length = this.typeArguments == null ? 0 : this.typeArguments.length;
            for (int i = 0; i < length; i++) {
                this.typeArguments[i].traverse(visitor, blockScope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
