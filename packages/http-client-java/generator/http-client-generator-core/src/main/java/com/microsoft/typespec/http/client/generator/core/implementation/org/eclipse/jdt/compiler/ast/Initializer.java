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
 *Contributors:
 *     IBM Corporation - initial API and implementation
 *     Stephan Herrmann - Contribution for
 *								Bug 429813 - [1.8][dom ast] IMethodBinding#getJavaElement() should return IMethod for lambda
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Parser;

public class Initializer extends FieldDeclaration {

    public Block block;

    public int bodyStart;
    public int bodyEnd;

    public Initializer(Block block, int modifiers) {
        this.block = block;
        this.modifiers = modifiers;

        if (block != null) {
            this.declarationSourceStart = this.sourceStart = block.sourceStart;
        }
    }

    /**
     */
    @Override
    public int getKind() {
        return 2;
    }

    public void parseStatements(Parser parser, TypeDeclaration typeDeclaration, CompilationUnitDeclaration unit) {
        // fill up the method body with statement
        parser.parse(this, typeDeclaration, unit);
    }

}
