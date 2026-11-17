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
 *     Stephan Herrmann - Contributions for
 *								bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *								Bug 415790 - [compiler][resource]Incorrect potential resource leak warning in for loop with close in try/catch
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class DoStatement extends Statement {

    public Expression condition;
    public Statement action;

    public DoStatement(Expression condition, Statement action, int sourceStart, int sourceEnd) {
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
        this.condition = condition;
        this.action = action;
        // remember useful empty statement
        if (action instanceof EmptyStatement)
            action.bits |= 1;
    }

}
