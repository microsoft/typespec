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
 *     Stephan Herrmann - Contribution for
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 416307 - [1.8][compiler][null] subclass with type parameter substitution confuses null checking
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 435570 - [1.8][null] @NonNullByDefault illegally tries to affect "throws E"
 *								Bug 466713 - Null Annotations: NullPointerException using <int @Nullable []> as Type Param
 *        Andy Clement - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class InstanceOfExpression extends OperatorExpression {

    public Expression expression;
    public TypeReference type;
    public Pattern pattern;

    public InstanceOfExpression(Expression expression, TypeReference type) {
        this.expression = expression;
        this.type = type;
        type.bits |= 1073741824; // https://bugs.eclipse.org/bugs/show_bug.cgi?id=282141
        this.bits |= 23 << 8;
        this.sourceStart = expression.sourceStart;
        this.sourceEnd = type.sourceEnd;
    }

    public InstanceOfExpression(Expression expression, Pattern pattern) {
        this.expression = expression;
        this.pattern = pattern;
        this.type = pattern.getType();
        this.type.bits |= 1073741824;
        this.bits |= 23 << 8;
        this.sourceStart = expression.sourceStart;
        this.sourceEnd = this.pattern.sourceEnd;
    }

    @Override
    public StringBuilder printExpressionNoParenthesis(int indent, StringBuilder output) {
        this.expression.printExpression(indent, output).append(" instanceof "); //$NON-NLS-1$
        return this.pattern == null ? this.type.print(0, output) : this.pattern.printExpression(0, output);
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.expression.traverse(visitor, scope);
            if (this.pattern != null) {
                this.pattern.traverse(visitor, scope);
            } else {
                this.type.traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
