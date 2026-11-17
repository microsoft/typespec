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
 *     Stephan Herrmann - Contribution for
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								bug 403086 - [compiler][null] include the effect of 'assert' in syntactic null analysis for fields
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class UnaryExpression extends OperatorExpression {

    public Expression expression;

    public UnaryExpression(Expression expression, int operator) {
        this.expression = expression;
        this.bits |= operator << 8; // encode operator
    }

}
