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
 *     Patrick Wienands <pwienands@abit.de> - Contribution for bug 393749
 *     Stephan Herrmann - Contribution for
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Parser;

public class Clinit extends AbstractMethodDeclaration {

    public Clinit(CompilationResult compilationResult) {
        super(compilationResult);
        this.modifiers = 0;
        this.selector = TypeConstants.CLINIT;
    }

    @Override
    public boolean isClinit() {
        return true;
    }

    @Override
    public boolean isStatic() {
        return true;
    }

    @Override
    public void parseStatements(Parser parser, CompilationUnitDeclaration unit) {
        // the clinit is filled by hand ....
    }

    @Override
    public StringBuilder print(int tab, StringBuilder output) {
        printIndent(tab, output).append("<clinit>()"); //$NON-NLS-1$
        printBody(tab + 1, output);
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        java.util.Objects.requireNonNull(visitor);
    }

}
