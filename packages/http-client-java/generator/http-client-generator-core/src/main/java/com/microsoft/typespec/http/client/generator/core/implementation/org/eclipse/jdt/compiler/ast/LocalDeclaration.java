// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2023 IBM Corporation and others.
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
 *							bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 *							bug 292478 - Report potentially null across variable assignment
 *							bug 335093 - [compiler][null] minimal hook for future null annotation support
 *							bug 349326 - [1.7] new warning for missing try-with-resources
 *							bug 186342 - [compiler][null] Using annotations for null checking
 *							bug 358903 - Filter practically unimportant resource leak warnings
 *							bug 370639 - [compiler][resource] restore the default for resource leak warnings
 *							bug 365859 - [compiler][null] distinguish warnings based on flow analysis vs. null annotations
 *							bug 388996 - [compiler][resource] Incorrect 'potential resource leak'
 *							bug 394768 - [compiler][resource] Incorrect resource leak warning when creating stream in conditional
 *							bug 395002 - Self bound generic class doesn't resolve bounds properly for wildcards for certain parametrisation.
 *							bug 383368 - [compiler][null] syntactic null analysis for field references
 *							bug 400761 - [compiler][null] null may be return as boolean without a diagnostic
 *							Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *							Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *							Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *							Bug 430150 - [1.8][null] stricter checking against type variables
 *							Bug 453483 - [compiler][null][loop] Improve null analysis for loops
 *     Jesper S Moller - Contributions for
 *							Bug 378674 - "The method can be declared as static" is wrong
 *							Bug 527554 - [18.3] Compiler support for JEP 286 Local-Variable Type
 *							Bug 529556 - [18.3] Add content assist support for 'var' as a type
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *							Bug 409250 - [1.8][compiler] Various loose ends in 308 code generation
 *							Bug 426616 - [1.8][compiler] Type Annotations, multiple problems
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class LocalDeclaration extends AbstractVariableDeclaration {

    public LocalDeclaration(char[] name, int sourceStart, int sourceEnd) {
        this.name = name;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
        this.declarationEnd = sourceEnd;
    }

    public boolean isReceiver() {
        return false;
    }

}
