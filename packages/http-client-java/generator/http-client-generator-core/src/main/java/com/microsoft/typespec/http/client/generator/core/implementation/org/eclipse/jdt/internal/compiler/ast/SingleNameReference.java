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
 *								bug 292478 - Report potentially null across variable assignment,
 *								bug 185682 - Increment/decrement operators mark local variables as read
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								Bug 412203 - [compiler] Internal compiler error: java.lang.IllegalArgumentException: info cannot be null
 *								Bug 458396 - NPE in CodeStream.invoke()
 *								Bug 407414 - [compiler][null] Incorrect warning on a primitive type being null
 *     Jesper S Moller - <jesper@selskabet.org>   - Contributions for
 *     							bug 382721 - [1.8][compiler] Effectively final variables needs special treatment
 *								bug 378674 - "The method can be declared as static" is wrong
 *								bug 404657 - [1.8][compiler] Analysis for effectively final variables fails to consider loops
 *								bug 527554 - [18.3] Compiler support for JEP 286 Local-Variable Type
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;

public class SingleNameReference extends NameReference {

    public char[] token;

    public SingleNameReference(char[] source, long pos) {
        super();
        this.token = source;
        this.sourceStart = (int) (pos >>> 32);
        this.sourceEnd = (int) pos;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        return output.append(this.token);
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        visitor.visit(this);

    }

    @Override
    public void traverse(ASTVisitor visitor) {
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public char[][] getName() {
        return new char[][] { this.token };
    }
}
