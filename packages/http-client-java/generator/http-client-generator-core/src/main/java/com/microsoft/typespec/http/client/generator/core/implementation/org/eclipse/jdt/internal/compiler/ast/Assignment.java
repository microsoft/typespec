// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2015 IBM Corporation and others.
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
 *     Genady Beriozkin - added support for reporting assignment with no effect
 *     Stephan Herrmann <stephan@cs.tu-berlin.de> - Contributions for
 * 							bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 * 							bug 292478 - Report potentially null across variable assignment
 *     						bug 335093 - [compiler][null] minimal hook for future null annotation support
 *     						bug 349326 - [1.7] new warning for missing try-with-resources
 *							bug 186342 - [compiler][null] Using annotations for null checking
 *							bug 358903 - Filter practically unimportant resource leak warnings
 *							bug 370639 - [compiler][resource] restore the default for resource leak warnings
 *							bug 365859 - [compiler][null] distinguish warnings based on flow analysis vs. null annotations
 *							bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *							bug 388996 - [compiler][resource] Incorrect 'potential resource leak'
 *							bug 394768 - [compiler][resource] Incorrect resource leak warning when creating stream in conditional
 *							bug 395002 - Self bound generic class doesn't resolve bounds properly for wildcards for certain parametrisation.
 *							bug 331649 - [compiler][null] consider null annotations for fields
 *							bug 383368 - [compiler][null] syntactic null analysis for field references
 *							bug 402993 - [null] Follow up of bug 401088: Missing warning about redundant null check
 *							bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *							Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *							Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *							Bug 453483 - [compiler][null][loop] Improve null analysis for loops
 *							Bug 407414 - [compiler][null] Incorrect warning on a primitive type being null
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class Assignment extends Expression {

    public Expression lhs;
    public Expression expression;

    public Assignment(Expression lhs, Expression expression, int sourceEnd) {
        this.lhs = lhs;
        lhs.bits |= 8192; // tag lhs as assigned
        this.expression = expression;
        this.sourceStart = lhs.sourceStart;
        this.sourceEnd = sourceEnd;
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        // no () when used as a statement
        printIndent(indent, output);
        return printExpressionNoParenthesis(indent, output);
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        // subclass redefine printExpressionNoParenthesis()
        output.append('(');
        return printExpressionNoParenthesis(0, output).append(')');
    }

    public StringBuilder printExpressionNoParenthesis(int indent, StringBuilder output) {
        this.lhs.printExpression(indent, output).append(" = "); //$NON-NLS-1$
        return this.expression.printExpression(0, output);
    }

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        // no () when used as a statement
        return print(indent, output).append(';');
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.lhs.traverse(visitor, scope);
            this.expression.traverse(visitor, scope);
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
