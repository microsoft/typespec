// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2005, 2020 IBM Corporation and others.
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
 *     David Foerster - patch for toUpperCase as described in https://bugs.eclipse.org/bugs/show_bug.cgi?id=153125
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

public abstract class ScannerHelper {

    public final static int[] OBVIOUS_IDENT_CHAR_NATURES = new int[128];

    static {
        OBVIOUS_IDENT_CHAR_NATURES[0] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[1] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[2] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[3] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[4] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[5] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[6] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[7] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[8] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[14] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[15] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[16] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[17] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[18] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[19] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[20] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[21] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[22] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[23] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[24] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[25] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[26] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[27] = 8;
        OBVIOUS_IDENT_CHAR_NATURES[127] = 8;

        for (int i = '0'; i <= '9'; i++)
            OBVIOUS_IDENT_CHAR_NATURES[i] = 4 | 8;

        for (int i = 'a'; i <= 'z'; i++)
            OBVIOUS_IDENT_CHAR_NATURES[i] = 16 | 8 | 64;
        for (int i = 'A'; i <= 'Z'; i++)
            OBVIOUS_IDENT_CHAR_NATURES[i] = 32 | 8 | 64;

        OBVIOUS_IDENT_CHAR_NATURES['_'] = 128 | 8 | 64;
        OBVIOUS_IDENT_CHAR_NATURES['$'] = 128 | 8 | 64;

        OBVIOUS_IDENT_CHAR_NATURES[9] = 1 | 256; // \ u0009: HORIZONTAL TABULATION
        OBVIOUS_IDENT_CHAR_NATURES[10] = 1 | 256; // \ u000a: LINE FEED
        OBVIOUS_IDENT_CHAR_NATURES[11] = 1;
        OBVIOUS_IDENT_CHAR_NATURES[12] = 1 | 256; // \ u000c: FORM FEED
        OBVIOUS_IDENT_CHAR_NATURES[13] = 1 | 256; // \ u000d: CARRIAGE RETURN
        OBVIOUS_IDENT_CHAR_NATURES[28] = 1;
        OBVIOUS_IDENT_CHAR_NATURES[29] = 1;
        OBVIOUS_IDENT_CHAR_NATURES[30] = 1;
        OBVIOUS_IDENT_CHAR_NATURES[31] = 1;
        OBVIOUS_IDENT_CHAR_NATURES[32] = 1 | 256; // \ u0020: SPACE

        OBVIOUS_IDENT_CHAR_NATURES['.'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES[':'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES[';'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES[','] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['['] = 2;
        OBVIOUS_IDENT_CHAR_NATURES[']'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['('] = 2;
        OBVIOUS_IDENT_CHAR_NATURES[')'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['{'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['}'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['+'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['-'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['*'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['/'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['='] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['&'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['|'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['?'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['<'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['>'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['!'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['%'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['^'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['~'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['"'] = 2;
        OBVIOUS_IDENT_CHAR_NATURES['\''] = 2;
    }

    public static boolean isJavaIdentifierPart(char c) {
        if (c < 128) {
            return (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 8) != 0;
        }
        return Character.isJavaIdentifierPart(c);
    }

    public static boolean isJavaIdentifierPart(char high, char low) {
        return Character.isJavaIdentifierPart(Character.toCodePoint(high, low));
    }

    public static boolean isJavaIdentifierStart(char c) {
        if (c < 128) {
            return (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 64) != 0;
        }
        return Character.isJavaIdentifierStart(c);
    }

    public static boolean isJavaIdentifierStart(char high, char low) {
        return Character.isJavaIdentifierStart(Character.toCodePoint(high, low));
    }

    public static boolean isDigit(char c) {
        if (c < 128) {
            return (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 4) != 0;
        }
        return Character.isDigit(c);
    }

    public static int digit(char c, int radix) {
        if (c < 128) {
            switch (radix) {
                case 8:
                    if (c >= 48 && c <= 55) {
                        return c - 48;
                    }
                    return -1;

                case 10:
                    if (c >= 48 && c <= 57) {
                        return c - 48;
                    }
                    return -1;

                case 16:
                    if (c >= 48 && c <= 57) {
                        return c - 48;
                    }
                    if (c >= 65 && c <= 70) {
                        return c - 65 + 10;
                    }
                    if (c >= 97 && c <= 102) {
                        return c - 97 + 10;
                    }
                    return -1;
            }
        }
        return Character.digit(c, radix);
    }

    public static int getHexadecimalValue(char c) {
        return switch (c) {
            case '0' -> 0;
            case '1' -> 1;
            case '2' -> 2;
            case '3' -> 3;
            case '4' -> 4;
            case '5' -> 5;
            case '6' -> 6;
            case '7' -> 7;
            case '8' -> 8;
            case '9' -> 9;
            case 'A', 'a' -> 10;
            case 'B', 'b' -> 11;
            case 'C', 'c' -> 12;
            case 'D', 'd' -> 13;
            case 'E', 'e' -> 14;
            case 'F', 'f' -> 15;
            default -> -1;
        };
    }

    public static char toLowerCase(char c) {
        if (c < 128) {
            if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 16) != 0) {
                return c;
            } else if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 32) != 0) {
                return (char) (32 + c);
            }
        }
        return Character.toLowerCase(c);
    }

    /**
     * Include also non JLS whitespaces.
     * <p>
     * return true if Character.isWhitespace(c) would return true
     */
    public static boolean isWhitespace(char c) {
        if (c < 128) {
            return (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 1) != 0;
        }
        return Character.isWhitespace(c);
    }

}
