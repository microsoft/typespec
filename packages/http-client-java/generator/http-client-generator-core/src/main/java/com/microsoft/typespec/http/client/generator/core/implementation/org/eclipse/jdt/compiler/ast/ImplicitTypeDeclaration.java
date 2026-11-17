// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2023, 2024 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CompilationResult;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Represents an implicitly declared class as defined in JEP 463
 */
public class ImplicitTypeDeclaration extends TypeDeclaration {

    public ImplicitTypeDeclaration(CompilationResult result) {
        super(result);
        this.modifiers = 16;

        Path p = Paths.get(new String(result.fileName));
        String basename = p.getFileName().toString();
        String className;
        if (basename.endsWith(".java")) { //$NON-NLS-1$
            className = basename.substring(0, basename.length() - 5);
        } else {
            className = basename;
        }

        this.name = className.toCharArray();
    }

}
