// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2013 IBM Corporation and others.
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
 *								bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 403086 - [compiler][null] include the effect of 'assert' in syntactic null analysis for fields
 *								bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class AssertStatement extends Statement {

    public Expression assertExpression, exceptionArgument;

    public AssertStatement(Expression exceptionArgument, Expression assertExpression, int startPosition) {
        this.assertExpression = assertExpression;
        this.exceptionArgument = exceptionArgument;
        this.sourceStart = startPosition;
        this.sourceEnd = exceptionArgument.sourceEnd;
    }

    public AssertStatement(Expression assertExpression, int startPosition) {
        this.assertExpression = assertExpression;
        this.sourceStart = startPosition;
        this.sourceEnd = assertExpression.sourceEnd;
    }

}
