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
 *     Stephan Herrmann - Contribution for
 *								bug 395002 - Self bound generic class doesn't resolve bounds properly for wildcards for certain parametrisation.
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								bug 400761 - [compiler][null] null may be return as boolean without a diagnostic
 *								Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *								Bug 429403 - [1.8][null] null mismatch from type arguments is not reported at field initializer
 *								Bug 453483 - [compiler][null][loop] Improve null analysis for loops
 *								Bug 458396 - NPE in CodeStream.invoke()
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *								Bug 409250 - [1.8][compiler] Various loose ends in 308 code generation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class FieldDeclaration extends AbstractVariableDeclaration {

    public Javadoc javadoc;

    public FieldDeclaration() {
        // for subtypes or conversion
    }

    public FieldDeclaration(char[] name, int sourceStart, int sourceEnd) {
        this.name = name;
        // due to some declaration like
        // int x, y = 3, z , x ;
        // the sourceStart and the sourceEnd is ONLY on the name
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
    }

    /**
     */

    public int getKind() {
        return this.type == null ? 3 : 1;
    }

}
