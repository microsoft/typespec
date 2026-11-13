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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util.Displayable;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public abstract class Util {

    private static final char[] SUFFIX_class = ".class".toCharArray();
    private static final char[] SUFFIX_CLASS = ".CLASS".toCharArray();

    public static class Displayable {

        public String displayString(Object o) {
            if (o == null)
                return "null"; //$NON-NLS-1$
            return o.toString();
        }
    }

    public static final String LINE_SEPARATOR = System.getProperty("line.separator"); //$NON-NLS-1$

    public static final String EMPTY_STRING = new String(CharOperation.NO_CHAR);
    static {
        new String(CharOperation.COMMA_SEPARATOR);
    }
    public static final int[] EMPTY_INT_ARRAY = new int[0];

    /**
     * Returns the contents of the given file as a char array. When encoding is null, then the platform default one is
     * used
     *
     * @throws IOException if a problem occured reading the file.
     */
    public static char[] getFileCharContent(File file, String encoding) throws IOException {
        return com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util
            .getBytesAsCharArray(Files.readAllBytes(file.toPath()), encoding);
    }

    /**
     * Returns the given input stream's contents as a byte array. All bytes in the stream are returned. Note this
     * doesn't close the stream.
     *
     * @throws IOException if a problem occurred reading the stream.
     */
    public static byte[] getInputStreamAsByteArray(InputStream input) throws IOException {
        return input.readAllBytes(); // will have even slighly better performance as of JDK17+ see JDK-8264777
    }

    private static Map<String, byte[]> bomByEncoding = new HashMap<>();
    static {
        // UTF-8 byte order mark:
        bomByEncoding.put("UTF-8", new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF }); //$NON-NLS-1$
        // XXX UTF-16, UTF-32 may have BOM too
    }

    public static char[] getBytesAsCharArray(byte[] byteContents, String encoding) {
        Charset charset;
        if (encoding == null) {
            charset = Charset.defaultCharset();
        } else {
            try {
                charset = Charset.forName(encoding);
            } catch (IllegalArgumentException e) {
                // encoding is not supported
                charset = Charset.defaultCharset();
            }
        }

        // check for BOM in encoded byte content
        // (instead of after decoding to avoid array copy after decoding):
        byte[] bom = bomByEncoding.get(charset.name());
        int start;
        if (bom != null && startsWith(byteContents, bom)) {
            start = bom.length; // skip BOM
        } else {
            start = 0;
        }

        return decode(byteContents, start, byteContents.length - start, charset);
    }

    /**
     * conversionless inmplementation of
     *
     * @return new String(srcBytes, start, length, charset).toCharArray();
     **/
    private static char[] decode(byte[] srcBytes, int start, int length, Charset charset) {
        ByteBuffer srcBuffer = ByteBuffer.wrap(srcBytes, start, length);
        CharBuffer destBuffer = charset.decode(srcBuffer);
        char[] dst = destBuffer.array();
        int chars = destBuffer.remaining();
        if (chars != dst.length) {
            dst = Arrays.copyOf(dst, chars);
        }
        return dst;
    }

    private static boolean startsWith(byte[] a, byte[] start) {
        if (a.length < start.length) {
            return false;
        }
        for (int i = 0; i < start.length; i++) {
            if (a[i] != start[i])
                return false;
        }
        return true;
    }

    public static CharSequence getStackTrace(Throwable exception) {
        StringWriter out = new StringWriter();
        PrintWriter s = new PrintWriter(out);
        exception.printStackTrace(s);
        return out.toString();
    }

    public static int getLineNumber(int position, int[] lineEnds, int g, int d) {
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
    public final static boolean isClassFileName(char[] name) {
        int nameLength = name == null ? 0 : name.length;
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

    public static void reverseQuickSort(char[][] list, int left, int right) {
        int original_left = left;
        int original_right = right;
        char[] mid = list[left + ((right - left) / 2)];
        do {
            while (CharOperation.compareTo(list[left], mid) > 0) {
                left++;
            }
            while (CharOperation.compareTo(mid, list[right]) > 0) {
                right--;
            }
            if (left <= right) {
                char[] tmp = list[left];
                list[left] = list[right];
                list[right] = tmp;
                left++;
                right--;
            }
        } while (left <= right);
        if (original_left < right) {
            reverseQuickSort(list, original_left, right);
        }
        if (left < original_right) {
            reverseQuickSort(list, left, original_right);
        }
    }

    public static void reverseQuickSort(char[][] list, int left, int right, int[] result) {
        int original_left = left;
        int original_right = right;
        char[] mid = list[left + ((right - left) / 2)];
        do {
            while (CharOperation.compareTo(list[left], mid) > 0) {
                left++;
            }
            while (CharOperation.compareTo(mid, list[right]) > 0) {
                right--;
            }
            if (left <= right) {
                char[] tmp = list[left];
                list[left] = list[right];
                list[right] = tmp;
                int temp = result[left];
                result[left] = result[right];
                result[right] = temp;
                left++;
                right--;
            }
        } while (left <= right);
        if (original_left < right) {
            reverseQuickSort(list, original_left, right, result);
        }
        if (left < original_right) {
            reverseQuickSort(list, left, original_right, result);
        }
    }

    /**
     * INTERNAL USE-ONLY Search the column number corresponding to a specific position
     */
    public static final int searchColumnNumber(int[] startLineIndexes, int lineNumber, int position) {
        switch (lineNumber) {
            case 1:
                return position + 1;

            case 2:
                return position - startLineIndexes[0];

            default:
                int line = lineNumber - 2;
                int length = startLineIndexes.length;
                if (line >= length) {
                    return position - startLineIndexes[length - 1];
                }
                return position - startLineIndexes[line];
        }
    }

    /**
     * Converts an array of Objects into String.
     */
    public static String toString(Object[] objects) {
        return toString(objects,
            new com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util.Displayable());
    }

    /**
     * Converts an array of Objects into String.
     */
    public static String toString(Object[] objects, Displayable renderer) {
        if (objects == null)
            return ""; //$NON-NLS-1$
        StringBuilder buffer = new StringBuilder(10);
        for (int i = 0; i < objects.length; i++) {
            if (i > 0)
                buffer.append(", "); //$NON-NLS-1$
            buffer.append(renderer.displayString(objects[i]));
        }
        return buffer.toString();
    }

    public static void appendEscapedChar(StringBuilder buffer, char c) {

        switch (c) {
            case '\b':
                buffer.append("\\b"); //$NON-NLS-1$
                break;

            case '\t':
                buffer.append("\\t"); //$NON-NLS-1$
                break;

            case '\n':
                buffer.append("\\n"); //$NON-NLS-1$
                break;

            case '\f':
                buffer.append("\\f"); //$NON-NLS-1$
                break;

            case '\r':
                buffer.append("\\r"); //$NON-NLS-1$
                break;

            case '\"': {
                buffer.append("\\\""); //$NON-NLS-1$
            }
                break;

            case '\'': {
                buffer.append(c);
            }
                break;

            case '\\':
                buffer.append("\\\\"); //$NON-NLS-1$
                break;

            default:
                if (c >= 0x20) {
                    buffer.append(c);
                } else if (c >= 0x10) {
                    buffer.append("\\u00").append(Integer.toHexString(c)); //$NON-NLS-1$
                } else if (c >= 0) {
                    buffer.append("\\u000").append(Integer.toHexString(c)); //$NON-NLS-1$
                } else {
                    buffer.append(c);
                }
        }
    }

}
