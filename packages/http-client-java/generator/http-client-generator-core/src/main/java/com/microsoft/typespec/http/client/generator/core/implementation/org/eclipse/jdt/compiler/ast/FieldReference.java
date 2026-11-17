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
 *     Stephan Herrmann <stephan@cs.tu-berlin.de> - Contributions for
 *								bug 185682 - Increment/decrement operators mark local variables as read
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								Bug 412203 - [compiler] Internal compiler error: java.lang.IllegalArgumentException: info cannot be null
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 458396 - NPE in CodeStream.invoke()
 *     Jesper S Moller - Contributions for
 *								Bug 378674 - "The method can be declared as static" is wrong
 *     Robert Roth <robert.roth.off@gmail.com> - Contributions for
 *								Bug 361039 - NPE in FieldReference.optimizedBooleanConstant
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class FieldReference extends Reference {

    public Expression receiver;
    public char[] token;

    public long nameSourcePosition; // (start<<32)+end

    public FieldReference(char[] source, long pos) {
        this.token = source;
        this.nameSourcePosition = pos;
        // by default the position are the one of the field (not true for super access)
        this.sourceStart = (int) (pos >>> 32);
        this.sourceEnd = (int) (pos & 0x00000000FFFFFFFFL);
        this.bits |= 1;
    }

}
