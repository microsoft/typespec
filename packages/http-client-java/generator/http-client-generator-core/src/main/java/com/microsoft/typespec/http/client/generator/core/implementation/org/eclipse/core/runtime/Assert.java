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
 * <code>Assert</code> is useful for for embedding runtime sanity checks in code. The predicate methods all test a
 * condition and throw some type of unchecked exception if the condition does not hold. <p> Assertion failure
 * exceptions, like most runtime exceptions, are thrown when something is misbehaving. Assertion failures are invariably
 * unspecified behavior; consequently, clients should never rely on these being thrown (and certainly should not be
 * catching them specifically). </p> <p> This class can be used without OSGi running. </p> <p> This class is not
 * intended to be instantiated or sub-classed by clients. </p>
 *
 * @since org.eclipse.equinox.common 3.2
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
public abstract class Assert {

    /**
     * Asserts that the given object is not <code>null</code>. If this is not the case, some kind of unchecked exception
     * is thrown.
     *
     * @param object the value to test
     */
    public static void isNotNull(Object object) {
        if (object == null) {
            throw new AssertionFailedException("null argument:" + ""); //$NON-NLS-1$
        }
    }

    /**
     * Asserts that the given boolean is <code>true</code>. If this is not the case, some kind of unchecked exception is
     * thrown.
     *
     * @param expression the outcome of the check
     * @return <code>true</code> if the check passes (does not return if the check fails)
     */
    public static boolean isTrue(boolean expression) {
        return isTrue(expression, ""); //$NON-NLS-1$
    }

    /**
     * Asserts that the given boolean is <code>true</code>. If this is not the case, some kind of unchecked exception is
     * thrown. The given message is included in that exception, to aid debugging.
     *
     * @param expression the outcome of the check
     * @param message the message to include in the exception
     * @return <code>true</code> if the check passes (does not return if the check fails)
     */
    public static boolean isTrue(boolean expression, String message) {
        if (!expression) {
            throw new AssertionFailedException("assertion failed: " + message); //$NON-NLS-1$
        }
        return expression;
    }
}
