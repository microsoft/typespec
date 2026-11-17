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

public class JavadocMessageSend extends MessageSend {

    public JavadocMessageSend(char[] name, long pos) {
        this.selector = name;
        this.nameSourcePosition = pos;
        this.sourceStart = (int) (this.nameSourcePosition >>> 32);
        this.sourceEnd = (int) this.nameSourcePosition;
        this.bits |= 32768;
    }

    public JavadocMessageSend(char[] name, long pos, JavadocArgumentExpression[] arguments) {
        this(name, pos);
        this.arguments = arguments;
    }

    @Override
    public boolean isSuperAccess() {
        return (this.bits & 16384) != 0;
    }

    /* Redefine to capture javadoc specific signatures */

    /* Redefine to capture javadoc specific signatures */

}
