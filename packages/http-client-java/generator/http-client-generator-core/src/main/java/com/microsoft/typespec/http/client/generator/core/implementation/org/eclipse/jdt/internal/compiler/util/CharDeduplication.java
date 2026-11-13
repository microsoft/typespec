// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2021 IBM Corporation and others.
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
 *     Joerg Kubitz    - threadlocal refactoring, all ASCII chars
 *                     - (copied content from PublicScanner.java / Scanner.java)
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util;

import java.lang.ref.SoftReference;
import java.util.Arrays;

public class CharDeduplication {

    private final static char[] CHAR_ARRAY0 = new char[0];
    static final char[] ASCII_CHARS[] = new char[128][];
    static {
        for (int i = 0; i < ASCII_CHARS.length; i++) {
            ASCII_CHARS[i] = new char[] { (char) i };
        }
    }

    private final static ThreadLocal<SoftReference<CharDeduplication>> mutableCache
        = ThreadLocal.withInitial(() -> new SoftReference<>(new CharDeduplication()));

    /** @return an instance that is *not* thread safe. To be used in a single thread only. **/
    public static CharDeduplication getThreadLocalInstance() {
        CharDeduplication local = mutableCache.get().get();
        if (local == null) {
            local = new CharDeduplication();
            mutableCache.set(new SoftReference<>(local));
        }
        return local;
    }

    /** single threaded only, hashtable with restricted linear probing **/
    private final char[][] hashTable = new char[8192][];
    private final int circularBufferPointer[] = new int[8192];

    private CharDeduplication() {
        // private
    }

    /**
     * like Arrays.copyOfRange(source, from, to) but returns a cached instance of the former result if available
     *
     * @param from start index (inclusive)
     * @param to end index (exclusive)
     * @return source[from..to-1]
     * @see java.util.Arrays#copyOfRange(char[], int, int)
     **/
    public char[] sharedCopyOfRange(char[] source, int from, int to) {
        int length = to - from;
        switch (length) {
            case 1:
                char charOne = source[from];
                if (charOne < ASCII_CHARS.length) {
                    return ASCII_CHARS[charOne];
                }
                break;

            case 0:
                return CHAR_ARRAY0;
        }
        int hash = hashCode(source, from, to);
        int circularBufferStart = hash & (8192 - 1);
        int positionToReplace = -1;
        // linear probing within circular buffer:
        for (int i = 0; i < 8; i++) {
            int position = (circularBufferStart + i) & (8192 - 1);
            char[] charArray = this.hashTable[position];
            if (charArray == null) {
                // this case only happens when the table is filling up,
                // but helps to get good deduplication fast
                positionToReplace = position;
            } else if (equals(source, from, to, charArray)) {
                // Successfully deduplicated:
                return charArray;
            }
        }
        char[] r = Arrays.copyOfRange(source, from, to);
        // not found -> overwrite existing entries in a circular buffer:
        if (positionToReplace == -1) {
            // no empty entry found - normal case:
            int j = this.circularBufferPointer[circularBufferStart]++;
            positionToReplace = (circularBufferStart + (j & (8 - 1))) & (8192 - 1);
        }
        this.hashTable[positionToReplace] = r;
        return r;
    }

    private int hashCode(char[] source, int from, int to) {
        int result = source[from];
        for (int i = from + 1; i < to; i++) {
            result = 31 * result + source[i];
        }
        return result;
    }

    private boolean equals(char[] source, int from, int to, char[] charArray) {
        if (charArray.length != to - from) {
            return false;
        }
        for (int i = from; i < to; i++) {
            if (source[i] != charArray[i - from]) {
                return false;
            }
        }
        return true;
    }
}
