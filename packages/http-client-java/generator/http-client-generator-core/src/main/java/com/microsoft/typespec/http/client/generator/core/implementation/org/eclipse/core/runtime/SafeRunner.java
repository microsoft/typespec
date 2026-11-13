// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2005, 2009 IBM Corporation and others.
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
 * Runs the given ISafeRunnable in a protected mode: exceptions and certain errors thrown in the runnable are logged.
 * Such exceptions are not rethrown by this method. <p> This class can be used without OSGi running. </p>
 *
 * @since org.eclipse.equinox.common 3.2
 */
public abstract class SafeRunner {

    /**
     * Runs the given runnable in a protected mode. Exceptions thrown in the runnable are logged. Such exceptions are
     * not rethrown by this method. <p> In addition to catching all {@link Exception} types, this method also catches
     * certain {@link Error} types that typically result from programming errors in the code being executed. Severe
     * errors that are not generally safe to catch are not caught by this method. </p>
     *
     * @param code the runnable to run
     */
    public static void run(ISafeRunnable code) {
        Assert.isNotNull(code);
        try {
            code.run();
        } catch (Exception | LinkageError | AssertionError e) {
            e.printStackTrace();
        }
    }
}
