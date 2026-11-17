// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) , 2024 IBM Corporation and others.
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
 *     Advantest R & D - Switch Expressions 2.0
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class YieldStatement extends BranchStatement {

    public Expression expression;

    public boolean isImplicit;

    public YieldStatement(Expression expression, boolean isImplicit, int sourceStart, int sourceEnd) {
        super(null, sourceStart, sourceEnd);
        this.expression = expression;
        this.isImplicit = isImplicit;
    }

}
