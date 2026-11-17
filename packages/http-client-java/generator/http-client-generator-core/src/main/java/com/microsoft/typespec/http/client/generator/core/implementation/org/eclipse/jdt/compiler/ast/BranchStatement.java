// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public abstract class BranchStatement extends Statement {

    public char[] label;

    /**
     * BranchStatement constructor comment.
     */
    public BranchStatement(char[] label, int sourceStart, int sourceEnd) {
        this.label = label;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
    }

}
