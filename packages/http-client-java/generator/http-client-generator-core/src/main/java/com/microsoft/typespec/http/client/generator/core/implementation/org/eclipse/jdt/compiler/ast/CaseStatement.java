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

    public Expression[] constantExpressions; // case with multiple expressions - if you want a under-the-hood view, use
    public boolean isSwitchRule = false;

    public CaseStatement(Expression[] constantExpressions, int sourceStart, int sourceEnd) {
        this.constantExpressions = constantExpressions;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
    }

}
