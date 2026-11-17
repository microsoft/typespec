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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

/*
 * Special unchecked exception type used
 * to abort from the compilation process
 *
 * should only be thrown from within problem handlers.
 */
public class AbortCompilation extends RuntimeException {

    public IProblem problem;

    public AbortCompilation() {
        // empty
    }

    public AbortCompilation(IProblem problem) {
        this();

        this.problem = problem;
    }

    @Override
    public String getMessage() {
        String message = super.getMessage();
        StringBuilder buffer = new StringBuilder(message == null ? Util.EMPTY_STRING : message);
        if (this.problem != null) {
            buffer.append(this.problem);
        }
        return String.valueOf(buffer);
    }

}
