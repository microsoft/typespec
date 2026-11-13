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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;

/*
 * Special unchecked exception type used
 * to abort from the compilation process
 *
 * should only be thrown from within problem handlers.
 */
public class AbortCompilation extends RuntimeException {

    public Throwable exception;
    public IProblem problem;

    public RuntimeException silentException;

    public AbortCompilation() {
        // empty
    }

    public AbortCompilation(CompilationResult compilationResult, IProblem problem) {
        this();

        this.problem = problem;
    }

    public AbortCompilation(CompilationResult compilationResult, Throwable exception) {
        this();

        this.exception = exception;
    }

    public AbortCompilation(RuntimeException silentException) {
        this();

        this.silentException = silentException;
    }

    @Override
    public String getMessage() {
        String message = super.getMessage();
        StringBuilder buffer = new StringBuilder(message == null ? Util.EMPTY_STRING : message);
        if (this.problem != null) {
            buffer.append(this.problem);
        } else if (this.exception != null) {
            message = this.exception.getMessage();
            buffer.append(message == null ? Util.EMPTY_STRING : message);
        } else if (this.silentException != null) {
            message = this.silentException.getMessage();
            buffer.append(message == null ? Util.EMPTY_STRING : message);
        }
        return String.valueOf(buffer);
    }

}
