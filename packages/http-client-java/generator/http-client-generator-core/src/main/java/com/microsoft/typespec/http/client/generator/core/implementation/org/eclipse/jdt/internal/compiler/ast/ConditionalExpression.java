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
 *     Stephen Herrmann <stephan@cs.tu-berlin.de> -  Contributions for
 *     						bug 133125 - [compiler][null] need to report the null status of expressions and analyze them simultaneously
 *     						bug 292478 - Report potentially null across variable assignment
 * 							bug 324178 - [null] ConditionalExpression.nullStatus(..) doesn't take into account the analysis of condition itself
 * 							bug 354554 - [null] conditional with redundant condition yields weak error message
 *     						bug 349326 - [1.7] new warning for missing try-with-resources
 *							bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *							bug 383368 - [compiler][null] syntactic null analysis for field references
 *							bug 400761 - [compiler][null] null may be return as boolean without a diagnostic
 *							Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *							Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *							Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *							Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *							Bug 426078 - [1.8] VerifyError when conditional expression passed as an argument
 *							Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *							Bug 418537 - [1.8][null] Fix null type annotation analysis for poly conditional expressions
 *							Bug 428352 - [1.8][compiler] Resolution errors don't always surface
 *							Bug 407414 - [compiler][null] Incorrect warning on a primitive type being null
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class ConditionalExpression extends OperatorExpression {

    public Expression condition, valueIfTrue, valueIfFalse;

    public ConditionalExpression(Expression condition, Expression valueIfTrue, Expression valueIfFalse) {
        this.condition = condition;
        this.valueIfTrue = valueIfTrue;
        this.valueIfFalse = valueIfFalse;
        this.sourceStart = condition.sourceStart;
        this.sourceEnd = valueIfFalse.sourceEnd;
    }

    @Override
    public StringBuilder printExpressionNoParenthesis(int indent, StringBuilder output) {
        this.condition.printExpression(indent, output).append(" ? "); //$NON-NLS-1$
        this.valueIfTrue.printExpression(0, output).append(" : "); //$NON-NLS-1$
        return this.valueIfFalse.printExpression(0, output);
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.condition.traverse(visitor, scope);
            this.valueIfTrue.traverse(visitor, scope);
            this.valueIfFalse.traverse(visitor, scope);
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
