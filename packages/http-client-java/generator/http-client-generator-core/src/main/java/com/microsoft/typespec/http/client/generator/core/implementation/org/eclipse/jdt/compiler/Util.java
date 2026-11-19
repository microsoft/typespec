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
 *     daolaf@gmail.com - Contribution for bug 3292227
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

import java.io.IOException;
import java.io.InputStream;

public abstract class Util {

    private static final char[] SUFFIX_class = ".class".toCharArray();
    private static final char[] SUFFIX_CLASS = ".CLASS".toCharArray();

    public static final String EMPTY_STRING = new String(CharOperation.NO_CHAR);
    public static final int[] EMPTY_INT_ARRAY = new int[0];

    /**
     * Returns the given input stream's contents as a byte array. All bytes in the stream are returned. Note this
     * doesn't close the stream.
     *
     * @throws IOException if a problem occurred reading the stream.
     */
    public static byte[] getInputStreamAsByteArray(InputStream input) throws IOException {
        return input.readAllBytes(); // will have even slighly better performance as of JDK17+ see JDK-8264777
    }

    public static int getLineNumber(int position, int[] lineEnds, int d) {
        int g = 0;
        if (lineEnds == null)
            return 1;
        if (d == -1)
            return 1;
        int m = g, start;
        while (g <= d) {
            m = g + (d - g) / 2;
            if (position < (start = lineEnds[m])) {
                d = m - 1;
            } else if (position > start) {
                g = m + 1;
            } else {
                return m + 1;
            }
        }
        if (position < lineEnds[m]) {
            return m + 1;
        }
        return m + 2;
    }

    /**
     * Returns true iff str.toLowerCase().endsWith(".class") implementation is not creating extra strings.
     */
    public static boolean isClassFileName(char[] name) {
        int nameLength = name.length;
        int suffixLength = SUFFIX_CLASS.length;
        if (nameLength < suffixLength)
            return false;

        for (int i = 0, offset = nameLength - suffixLength; i < suffixLength; i++) {
            char c = name[offset + i];
            if (c != SUFFIX_class[i] && c != SUFFIX_CLASS[i])
                return false;
        }
        return true;
    }

}
