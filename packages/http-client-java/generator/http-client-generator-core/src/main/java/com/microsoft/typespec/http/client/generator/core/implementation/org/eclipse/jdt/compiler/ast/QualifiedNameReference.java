// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
 *     							bug 185682 - Increment/decrement operators mark local variables as read
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 365519 - editorial cleanup after bug 186342 and bug 365387
 *								bug 368546 - [compiler][resource] Avoid remaining false positives found when compiling the Eclipse SDK
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								Bug 414380 - [compiler][internal] QualifiedNameReference#indexOfFirstFieldBinding does not point to the first field
 *								Bug 458396 - NPE in CodeStream.invoke()
 *     Jesper S Moller - Contributions for
 *								bug 382721 - [1.8][compiler] Effectively final variables needs special treatment
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								bug 402993 - [null] Follow up of bug 401088: Missing warning about redundant null check
 *     Jesper S Moller <jesper@selskabet.org> - Contributions for
 *								bug 378674 - "The method can be declared as static" is wrong
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class QualifiedNameReference extends NameReference {

    public char[][] tokens;
    public long[] sourcePositions;

    public QualifiedNameReference(char[][] tokens, long[] positions, int sourceStart, int sourceEnd) {
        this.tokens = tokens;
        this.sourcePositions = positions;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
    }

    @Override
    public char[][] getName() {
        return this.tokens;
    }

}
