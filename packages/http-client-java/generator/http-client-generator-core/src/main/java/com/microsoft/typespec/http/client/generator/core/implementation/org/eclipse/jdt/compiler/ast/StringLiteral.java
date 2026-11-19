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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class StringLiteral extends Literal {

    /** may be null, prefixes tail **/
    protected StringLiteral optionalHead;
    /** StringLiteral or char[] tail **/
    protected Object tail;

    public StringLiteral(char[] token, int start, int end) {
        this(null, token, start, end);
    }

    protected StringLiteral(StringLiteral optionalHead, Object tail, int start, int end) {
        super(start, end);
        this.optionalHead = optionalHead;
        this.tail = tail;
    }

    /**
     * creates a copy of dedicated Type for unoptimizeStringLiterals with the given StringLiteral appended
     */
    public StringLiteralConcatenation extendsWith(StringLiteral lit) {
        return new StringLiteralConcatenation(this, lit);
    }
}
