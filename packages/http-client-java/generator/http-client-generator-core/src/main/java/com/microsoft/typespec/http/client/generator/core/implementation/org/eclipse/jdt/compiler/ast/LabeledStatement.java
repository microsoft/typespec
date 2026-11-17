// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2018 IBM Corporation and others.
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

public class LabeledStatement extends Statement {

    public Statement statement;
    public char[] label;

    public int labelEnd;

    /**
     * LabeledStatement constructor comment.
     */
    public LabeledStatement(char[] label, Statement statement, long labelPosition, int sourceEnd) {
        this.statement = statement;
        // remember useful empty statement
        if (statement instanceof EmptyStatement)
            statement.bits |= 1;
        this.label = label;
        this.sourceStart = (int) (labelPosition >>> 32);
        this.labelEnd = (int) labelPosition;
        this.sourceEnd = sourceEnd;
    }

}
