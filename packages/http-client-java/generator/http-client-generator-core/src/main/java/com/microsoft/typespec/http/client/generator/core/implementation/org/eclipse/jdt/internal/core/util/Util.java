// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
 *     Stephan Herrmann - Contribution for
 *								Bug 458577 - IClassFile.getWorkingCopy() may lead to NPE in BecomeWorkingCopyOperation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.util;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime.Status;

/**
 * Provides convenient utility methods to other types in this package.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public abstract class Util {

    /**
     * Finds the first line separator used by the given text.
     *
     * @return <code>"\n"</code> or <code>"\r"</code> or <code>"\r\n"</code>, or <code>null</code> if none found
     */
    public static String findLineSeparator(char[] text) {
        // find the first line separator
        int length = text.length;
        if (length > 0) {
            char nextChar = text[0];
            for (int i = 0; i < length; i++) {
                char currentChar = nextChar;
                nextChar = i < length - 1 ? text[i + 1] : ' ';
                switch (currentChar) {
                    case '\n':
                        return "\n"; //$NON-NLS-1$

                    case '\r':
                        return nextChar == '\n' ? "\r\n" : "\r"; //$NON-NLS-1$ //$NON-NLS-2$
                }
            }
        }
        // not found
        return null;
    }

    /*
     * Add a log entry
     */
    public static void log(Throwable e, String message) {
        System.err.println(new Status(message, e).toString());
    }

}
