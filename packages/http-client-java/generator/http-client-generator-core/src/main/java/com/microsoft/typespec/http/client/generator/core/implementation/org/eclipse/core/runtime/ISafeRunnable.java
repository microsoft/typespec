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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime;

/**
 * Safe runnables represent blocks of code and associated exception handlers. They are typically used when a plug-in
 * needs to call some untrusted code (e.g., code contributed by another plug-in via an extension). <p> This class can
 * be used without OSGi running. </p> <p> The runnable rethrows the exception it was created with so that
 * {@link SafeRunner} reports it. </p>
 *
 * @see SafeRunner#run(ISafeRunnable)
 */
public final class ISafeRunnable {
    private final Exception exception;

    /**
     * Creates a runnable that rethrows the given exception.
     *
     * @param exception the exception to rethrow
     */
    public ISafeRunnable(Exception exception) {
        this.exception = exception;
    }

    /**
     * Runs this runnable. Any exceptions thrown from this method will be logged by the caller.
     *
     * @exception Exception if a problem occurred while running this method
     * @see SafeRunner#run(ISafeRunnable)
     */
    public void run() throws Exception {
        throw this.exception;
    }
}
