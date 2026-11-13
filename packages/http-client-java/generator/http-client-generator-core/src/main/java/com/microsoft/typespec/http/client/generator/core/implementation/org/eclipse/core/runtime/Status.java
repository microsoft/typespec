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
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *     Alexander Fedorov (ArSysOp) - Bug 561712
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime;

import java.util.Objects;

/**
 * A status object represents the outcome of an operation. A status carries a message and an optional exception for
 * problems stemming from a failure at a lower level; its severity, plug-in identifier and status code are always
 * <code>ERROR</code>, <code>org.eclipse.jdt.core</code> and <code>4</code>.
 */
public class Status {

    /**
     * Message, localized to the current locale.
     */
    private final String message;

    /**
     * Wrapped exception, or <code>null</code> if none.
     */
    private final Throwable exception;

    /**
     * Creates a new status object.
     *
     * @param message a human-readable message, localized to the current locale. If null or empty a message from the
     * exception is interpolated.
     * @param exception a low-level exception, or <code>null</code> if not applicable
     */
    public Status(String message, Throwable exception) {
        this.message = Objects.requireNonNullElse(interpolateMessage(message, exception), "");
        this.exception = exception;
    }

    private static String interpolateMessage(String msg, Throwable e) {
        if ((msg == null || msg.isEmpty()) && e != null) {
            msg = e.getMessage();
            if (msg == null || msg.isEmpty()) { // null was the old NPE msg Style
                msg = e.getClass().getSimpleName();
            }
        }
        return msg;
    }

    /**
     * Returns a string representation of the status, suitable for debugging purposes only.
     */
    @Override
    public String toString() {
        StringBuilder buf = new StringBuilder();
        buf.append("Status ERROR: org.eclipse.jdt.core code=4 "); //$NON-NLS-1$
        buf.append(message);
        if (exception != null) {
            buf.append(' ');
            buf.append(exception);
        }
        return buf.toString();
    }
}
