// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import java.io.IOException;

/*
 * Special unchecked exception type used
 * to abort from the compilation process
 *
 * should only be thrown from within problem handlers.
 */
public class AbortCompilationUnit extends AbortCompilation {

    public String encoding;

    public AbortCompilationUnit(CompilationResult compilationResult, IProblem problem) {
        super(compilationResult, problem);
    }

    /**
     * Used to surface encoding issues when reading sources
     */
    public AbortCompilationUnit(IOException exception, String encoding) {
        super(((CompilationResult) null), exception);
        this.encoding = encoding;
    }
}
