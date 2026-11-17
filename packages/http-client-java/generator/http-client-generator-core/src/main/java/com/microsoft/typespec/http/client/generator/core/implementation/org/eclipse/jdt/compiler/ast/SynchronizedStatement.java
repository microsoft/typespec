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
 *     Carmi Grushko - Bug 465048 - Binding is null for class literals in synchronized blocks
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class SynchronizedStatement extends Statement { // comes with a hidden finally block that

    public Expression expression;
    public Block block;

    public SynchronizedStatement(Expression expression, Block statement, int s, int e) {
        this.expression = expression;
        this.block = statement;
        this.sourceEnd = e;
        this.sourceStart = s;
    }

}
