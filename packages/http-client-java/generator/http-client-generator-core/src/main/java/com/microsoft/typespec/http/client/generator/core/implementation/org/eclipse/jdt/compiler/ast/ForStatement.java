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
 *     							bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 *     							bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *								Bug 415790 - [compiler][resource]Incorrect potential resource leak warning in for loop with close in try/catch
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class ForStatement extends Statement {

    public Statement[] initializations;
    public Expression condition;
    public Statement[] increments;
    public Statement action;

    public ForStatement(Statement[] initializations, Expression condition, Statement[] increments, Statement action,
        boolean neededScope, int s, int e) {
        this.sourceStart = s;
        this.sourceEnd = e;
        this.initializations = initializations;
        this.condition = condition;
        this.increments = increments;
        this.action = action;
        // remember useful empty statement
        if (action instanceof EmptyStatement)
            action.bits |= 1;
        if (neededScope) {
            this.bits |= 536870912;
        }
    }

}
