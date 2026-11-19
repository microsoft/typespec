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
 *     Advantest R & D - Enhanced Switches v2.0
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class CaseStatement extends Statement {

    public Expression constantExpression; // null for 'default'

    public CaseStatement(Expression constantExpression, int sourceStart, int sourceEnd) {
        this.constantExpression = constantExpression;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
    }

}
