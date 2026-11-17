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

import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.IOException;

public abstract class ScannerHelper {

    public final static long[] Bits = {
        1,
        2,
        4,
        8,
        16,
        32,
        64,
        128,
        256,
        512,
        1024,
        2048,
        4096,
        8192,
        16384,
        32768,
        65536,
        131072,
        262144,
        524288,
        1048576,
        2097152,
        4194304,
        8388608,
        16777216,
        33554432,
        67108864,
        134217728,
        268435456,
        536870912,
        1073741824,
        2147483648L,
        4294967296L,
        8589934592L,
        17179869184L,
        34359738368L,
        68719476736L,
        137438953472L,
        274877906944L,
        549755813888L,
        1099511627776L,
        2199023255552L,
        4398046511104L,
        8796093022208L,
        17592186044416L,
        35184372088832L,
        70368744177664L,
        140737488355328L,
        281474976710656L,
        562949953421312L,
        1125899906842624L,
        2251799813685248L,
        4503599627370496L,
        9007199254740992L,
        18014398509481984L,
        36028797018963968L,
        72057594037927936L,
        144115188075855872L,
        288230376151711744L,
        576460752303423488L,
        1152921504606846976L,
        2305843009213693952L,
        4611686018427387904L,
        -9223372036854775808L, };

    private static long[][][] Tables8;

    private static long[][][] Tables11;

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

    static void initializeTable18() {
        Tables8 = initializeTables("unicode6_2"); //$NON-NLS-1$
    }

    static void initializeTableJava11() {
        Tables11 = initializeTables("unicode10"); //$NON-NLS-1$
    }

    static long[][][] initializeTables(String unicode_path) {
        long[][][] tempTable = new long[2][][];
        tempTable[0] = new long[3][];
        tempTable[1] = new long[4][];
        try (DataInputStream inputStream = new DataInputStream(
            new BufferedInputStream(ScannerHelper.class.getResourceAsStream(unicode_path + "/start0.rsc")))) { //$NON-NLS-1$
            long[] readValues = new long[1024];
            for (int i = 0; i < 1024; i++) {
                readValues[i] = inputStream.readLong();
            }
            tempTable[0][0] = readValues;
        } catch (IOException e) {
            e.printStackTrace();
        }
        try (DataInputStream inputStream = new DataInputStream(
            new BufferedInputStream(ScannerHelper.class.getResourceAsStream(unicode_path + "/start1.rsc")))) { //$NON-NLS-1$
            long[] readValues = new long[1024];
            for (int i = 0; i < 1024; i++) {
                readValues[i] = inputStream.readLong();
            }
            tempTable[0][1] = readValues;
        } catch (IOException e) {
            e.printStackTrace();
        }
        try (DataInputStream inputStream = new DataInputStream(
            new BufferedInputStream(ScannerHelper.class.getResourceAsStream(unicode_path + "/start2.rsc")))) { //$NON-NLS-1$
            long[] readValues = new long[1024];
            for (int i = 0; i < 1024; i++) {
                readValues[i] = inputStream.readLong();
            }
            tempTable[0][2] = readValues;
        } catch (IOException e) {
            e.printStackTrace();
        }
        try (DataInputStream inputStream = new DataInputStream(
            new BufferedInputStream(ScannerHelper.class.getResourceAsStream(unicode_path + "/part0.rsc")))) { //$NON-NLS-1$
            long[] readValues = new long[1024];
            for (int i = 0; i < 1024; i++) {
                readValues[i] = inputStream.readLong();
            }
            tempTable[1][0] = readValues;
        } catch (IOException e) {
            e.printStackTrace();
        }
        try (DataInputStream inputStream = new DataInputStream(
            new BufferedInputStream(ScannerHelper.class.getResourceAsStream(unicode_path + "/part1.rsc")))) { //$NON-NLS-1$
            long[] readValues = new long[1024];
            for (int i = 0; i < 1024; i++) {
                readValues[i] = inputStream.readLong();
            }
            tempTable[1][1] = readValues;
        } catch (IOException e) {
            e.printStackTrace();
        }
        try (DataInputStream inputStream = new DataInputStream(
            new BufferedInputStream(ScannerHelper.class.getResourceAsStream(unicode_path + "/part2.rsc")))) { //$NON-NLS-1$
            long[] readValues = new long[1024];
            for (int i = 0; i < 1024; i++) {
                readValues[i] = inputStream.readLong();
            }
            tempTable[1][2] = readValues;
        } catch (IOException e) {
            e.printStackTrace();
        }
        try (DataInputStream inputStream = new DataInputStream(
            new BufferedInputStream(ScannerHelper.class.getResourceAsStream(unicode_path + "/part14.rsc")))) { //$NON-NLS-1$
            long[] readValues = new long[1024];
            for (int i = 0; i < 1024; i++) {
                readValues[i] = inputStream.readLong();
            }
            tempTable[1][3] = readValues;
        } catch (IOException e) {
            e.printStackTrace();
        }
        return tempTable;
    }

    private static boolean isBitSet(long[] values, int i) {
        try {
            return (values[i / 64] & Bits[i % 64]) != 0;
        } catch (NullPointerException e) {
            return false;
        }
    }

    public static boolean isJavaIdentifierPart(char c) {
        if (c < 128) {
            return (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 8) != 0;
        }
        return Character.isJavaIdentifierPart(c);
    }

    public static boolean isJavaIdentifierPart(long complianceLevel, char c) {
        if (c < 128) {
            return (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 8) != 0;
        }
        return isJavaIdentifierPart(complianceLevel, (int) c);
    }

    private static boolean isJavaIdentifierPart0(int codePoint, long[][][] tables) {
        return switch ((codePoint & 0x1F0000) >> 16) {
            case 0 -> isBitSet(tables[1][0], codePoint & 0xFFFF);
            case 1 -> isBitSet(tables[1][1], codePoint & 0xFFFF);
            case 2 -> isBitSet(tables[1][2], codePoint & 0xFFFF);
            case 14 -> isBitSet(tables[1][3], codePoint & 0xFFFF);
            default -> false;
        };
    }

    public static boolean isJavaIdentifierPart(long complianceLevel, int codePoint) {
        if (complianceLevel <= 3407872L) {
            // java 8 supports Unicode 6.2
            if (Tables8 == null) {
                initializeTable18();
            }
            return isJavaIdentifierPart0(codePoint, Tables8);
        }
        // java 11 supports Unicode 10
        if (Tables11 == null) {
            initializeTableJava11();
        }
        return isJavaIdentifierPart0(codePoint, Tables11);
    }

    public static boolean isJavaIdentifierPart(long complianceLevel, char high, char low) {
        return isJavaIdentifierPart(complianceLevel, toCodePoint(high, low));
    }

    public static boolean isJavaIdentifierStart(long complianceLevel, char c) {
        if (c < 128) {
            return (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 64) != 0;
        }
        return ScannerHelper.isJavaIdentifierStart(complianceLevel, (int) c);
    }

    public static boolean isJavaIdentifierStart(long complianceLevel, char high, char low) {
        return isJavaIdentifierStart(complianceLevel, toCodePoint(high, low));
    }

    private static boolean isJavaIdentifierStart0(int codePoint, long[][][] tables) {
        return switch ((codePoint & 0x1F0000) >> 16) {
            case 0 -> isBitSet(tables[0][0], codePoint & 0xFFFF);
            case 1 -> isBitSet(tables[0][1], codePoint & 0xFFFF);
            case 2 -> isBitSet(tables[0][2], codePoint & 0xFFFF);
            default -> false;
        };
    }

    public static boolean isJavaIdentifierStart(long complianceLevel, int codePoint) {
        if (complianceLevel <= 3407872L) {
            // java 8 supports Unicode 6.2
            if (Tables8 == null) {
                initializeTable18();
            }
            return isJavaIdentifierStart0(codePoint, Tables8);
        }
        // java 11 supports Unicode 10
        if (Tables11 == null) {
            initializeTableJava11();
        }
        return isJavaIdentifierStart0(codePoint, Tables11);
    }

    private static int toCodePoint(char high, char low) {
        return (high - 55296) * 0x400 + (low - 56320) + 0x10000;
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

    public static int getNumericValue(char c) {
        if (c < 128) {
            switch (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c]) {
                case 4:
                    return c - '0';

                case 16:
                    return 10 + c - 'a';

                case 32:
                    return 10 + c - 'A';
            }
        }
        return Character.getNumericValue(c);
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
     *
     * return true if Character.isWhitespace(c) would return true
     */
    public static boolean isWhitespace(char c) {
        if (c < 128) {
            return (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 1) != 0;
        }
        return Character.isWhitespace(c);
    }

}
