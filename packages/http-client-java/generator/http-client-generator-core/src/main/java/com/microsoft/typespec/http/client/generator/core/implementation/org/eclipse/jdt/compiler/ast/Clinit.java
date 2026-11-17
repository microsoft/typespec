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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Parser;

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

}
