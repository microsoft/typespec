// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2020 IBM Corporation and others.
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
 *     Luiz-Otavio Zorzella <zorzella at gmail dot com> - Improve CamelCase algorithm
 *     Gábor Kövesdán - Contribution for Bug 350000 - [content assist] Include non-prefix matches in auto-complete suggestions
 *     Stefan Xenos <sxenos@gmail.com> (Google) - Bug 501283 - Lots of hash collisions during indexing
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.ScannerHelper;
import java.util.Arrays;

/**
 * This class is a collection of helper methods to manipulate char arrays.
 *
 * @since 2.1
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
public abstract class CharOperation {

    /**
     * Constant for an empty char array
     */
    public static final char[] NO_CHAR = new char[0];

    /**
     * Constant for an empty char array with two dimensions.
     */
    public static final char[][] NO_CHAR_CHAR = new char[0][];

    /**
     * Constant for an empty String array.
     *
     * @since 3.1
     */
    public static final String[] NO_STRINGS = new String[0];

    /**
     * Constant for comma
     *
     * @since 3.14
     */
    public static final char[] COMMA_SEPARATOR = new char[] { ',' };

    /**
     * Returns the char array as a String
     *
     * @param charArray the char array to convert
     * @return the char array as a String or null if the given char array is null.
     * @since 3.0
     */
    public static String charToString(char[] charArray) {
        if (charArray == null)
            return null;
        return new String(charArray);
    }

    /**
     * Compares the two char arrays lexicographically.
     *
     * Returns a negative integer if array1 lexicographically precedes the array2, a positive integer if this array1
     * lexicographically follows the array2, or zero if both arrays are equal.
     *
     * @param array1 the first given array
     * @param array2 the second given array
     * @return the returned value of the comparison between array1 and array2
     * @throws NullPointerException if one of the arrays is null
     * @since 3.3
     */
    public static int compareTo(char[] array1, char[] array2) {
        int length1 = array1.length;
        int length2 = array2.length;
        int min = Math.min(length1, length2);
        for (int i = 0; i < min; i++) {
            if (array1[i] != array2[i]) {
                return array1[i] - array2[i];
            }
        }
        return length1 - length2;
    }

    /**
     * Answers the concatenation of the two arrays. It answers null if the two arrays are null. If the first array is
     * null, then the second array is returned. If the second array is null, then the first array is returned. <br> <br>
     * For example: <ol> <li>
     *
     * <pre>
     *    first = null
     *    second = { 'a' }
     *    => result = { ' a' }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { ' a' }
     *    second = null
     *    => result = { ' a' }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { ' a' }
     *    second = { ' b' }
     *    => result = { ' a' , ' b' }
     * </pre>
     *
     * </li> </ol>
     *
     * @param first the first array to concatenate
     * @param second the second array to concatenate
     * @return the concatenation of the two arrays, or null if the two arrays are null.
     */
    public static char[] concat(char[] first, char[] second) {
        if (first == null)
            return second;
        if (second == null)
            return first;

        int length1 = first.length;
        int length2 = second.length;
        char[] result = new char[length1 + length2];
        System.arraycopy(first, 0, result, 0, length1);
        System.arraycopy(second, 0, result, length1, length2);
        return result;
    }

    /**
     * Answers the concatenation of the three arrays. It answers null if the three arrays are null. If first is null, it
     * answers the concatenation of second and third. If second is null, it answers the concatenation of first and
     * third. If third is null, it answers the concatenation of first and second. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    first = null
     *    second = { 'a' }
     *    third = { 'b' }
     *    => result = { ' a', 'b' }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { 'a' }
     *    second = null
     *    third = { 'b' }
     *    => result = { ' a', 'b' }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { 'a' }
     *    second = { 'b' }
     *    third = null
     *    => result = { ' a', 'b' }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = null
     *    second = null
     *    third = null
     *    => result = null
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { 'a' }
     *    second = { 'b' }
     *    third = { 'c' }
     *    => result = { 'a', 'b', 'c' }
     * </pre>
     *
     * </li> </ol>
     *
     * @param first the first array to concatenate
     * @param second the second array to concatenate
     * @param third the third array to concatenate
     *
     * @return the concatenation of the three arrays, or null if the three arrays are null.
     */
    public static char[] concat(char[] first, char[] second, char[] third) {
        if (first == null)
            return concat(second, third);
        if (second == null)
            return concat(first, third);
        if (third == null)
            return concat(first, second);

        int length1 = first.length;
        int length2 = second.length;
        int length3 = third.length;
        char[] result = new char[length1 + length2 + length3];
        System.arraycopy(first, 0, result, 0, length1);
        System.arraycopy(second, 0, result, length1, length2);
        System.arraycopy(third, 0, result, length1 + length2, length3);
        return result;
    }

    /**
     * Answers the concatenation of the given array parts using the given separator between each part. <br> <br> For
     * example:<br> <ol> <li>
     *
     * <pre>
     *    array = { { 'a' }, { 'b' } }
     *    separator = '.'
     *    => result = { 'a', '.', 'b' }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    array = null
     *    separator = '.'
     *    => result = { }
     * </pre>
     *
     * </li> </ol>
     *
     * @param array the given array
     * @param separator the given separator
     * @return the concatenation of the given array parts using the given separator between each part
     */
    public static char[] concatWith(char[][] array, char separator) {
        int length = array == null ? 0 : array.length;
        if (length == 0)
            return CharOperation.NO_CHAR;

        int size = length - 1;
        int index = length;
        while (--index >= 0) {
            if (array[index].length == 0)
                size--;
            else
                size += array[index].length;
        }
        if (size <= 0)
            return CharOperation.NO_CHAR;
        char[] result = new char[size];
        index = length;
        while (--index >= 0) {
            length = array[index].length;
            if (length > 0) {
                System.arraycopy(array[index], 0, result, (size -= length), length);
                if (--size >= 0)
                    result[size] = separator;
            }
        }
        return result;
    }

    /**
     * Answers true if the two arrays are identical character by character, otherwise false. The equality is case
     * sensitive. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    first = null
     *    second = null
     *    result => true
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { }
     *    second = null
     *    result => false
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { 'a' }
     *    second = { 'a' }
     *    result => true
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { 'a' }
     *    second = { 'A' }
     *    result => false
     * </pre>
     *
     * </li> </ol>
     *
     * @param first the first array
     * @param second the second array
     * @return true if the two arrays are identical character by character, otherwise false
     */
    public static boolean equals(char[] first, char[] second) {
        return Arrays.equals(first, second);
    }

    /**
     * Answers true if the first array is identical character by character to a portion of the second array delimited
     * from position secondStart (inclusive) to secondEnd(exclusive), otherwise false. The equality is case sensitive.
     * <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    first = null
     *    second = null
     *    secondStart = 0
     *    secondEnd = 0
     *    result => true
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { }
     *    second = null
     *    secondStart = 0
     *    secondEnd = 0
     *    result => false
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { 'a' }
     *    second = { 'a' }
     *    secondStart = 0
     *    secondEnd = 1
     *    result => true
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { 'a' }
     *    second = { 'A' }
     *    secondStart = 0
     *    secondEnd = 1
     *    result => false
     * </pre>
     *
     * </li> </ol>
     *
     * @param first the first array
     * @param second the second array
     * @param secondEnd exclusive end position in the second array to compare
     * @return true if the first array is identical character by character to fragment of second array ranging from
     * secondStart to secondEnd-1, otherwise false
     * @since 3.0
     */
    public static boolean equals(char[] first, char[] second, int secondEnd) {
        if (first == second)
            return true;
        if (first == null || second == null)
            return false;
        if (first.length != secondEnd)
            return false;
        for (int i = first.length; --i >= 0;)
            if (first[i] != second[i])
                return false;
        return true;
    }

    /**
     * If isCaseSensite is true, answers true if the two arrays are identical character by character, otherwise false.
     * If it is false, answers true if the two arrays are identical character by character without checking the case,
     * otherwise false. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    first = null
     *    second = null
     *    isCaseSensitive = true
     *    result => true
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { }
     *    second = null
     *    isCaseSensitive = true
     *    result => false
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { 'A' }
     *    second = { 'a' }
     *    isCaseSensitive = true
     *    result => false
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    first = { 'A' }
     *    second = { 'a' }
     *    isCaseSensitive = false
     *    result => true
     * </pre>
     *
     * </li> </ol>
     *
     * @param first the first array
     * @param second the second array
     * @param isCaseSensitive check whether or not the equality should be case sensitive
     * @return true if the two arrays are identical character by character according to the value of isCaseSensitive,
     * otherwise false
     */
    public static boolean equals(char[] first, char[] second, boolean isCaseSensitive) {
        if (isCaseSensitive) {
            return equals(first, second);
        }
        if (first == second)
            return true;
        if (first == null || second == null)
            return false;
        if (first.length != second.length)
            return false;

        for (int i = first.length; --i >= 0;)
            if (ScannerHelper.toLowerCase(first[i]) != ScannerHelper.toLowerCase(second[i]))
                return false;
        return true;
    }

    /**
     * Answers true if c is a whitespace according to the JLS (&#92;u0009, &#92;u000a, &#92;u000c, &#92;u000d,
     * &#92;u0020), otherwise false. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    c = ' '
     *    result => true
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    c = '&#92;u3000'
     *    result => false
     * </pre>
     *
     * </li> </ol>
     *
     * @param c the character to check
     * @return true if c is a whitespace according to the JLS, otherwise false.
     */
    public static boolean isWhitespace(char c) {
        return c < 128 && ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 256) != 0);
    }

    /**
     * Answers the first index in the array for which the corresponding character is equal to toBeFound. Answers -1 if
     * no occurrence of this character is found. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    toBeFound = 'c'
     *    array = { ' a', 'b', 'c', 'd' }
     *    result => 2
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    toBeFound = 'e'
     *    array = { ' a', 'b', 'c', 'd' }
     *    result => -1
     * </pre>
     *
     * </li> </ol>
     *
     * @param toBeFound the character to search
     * @param array the array to be searched
     * @return the first index in the array for which the corresponding character is equal to toBeFound, -1 otherwise
     * @throws NullPointerException if array is null
     */
    public static int indexOf(char toBeFound, char[] array) {
        return indexOf(toBeFound, array, 0);
    }

    /**
     * Answers the first index in the array for which the toBeFound array is a matching subarray following the case rule
     * starting at the index start. Answers -1 if no match is found. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    toBeFound = { 'c' }
     *    array = { ' a', 'b', 'c', 'd' }
     *    result => 2
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    toBeFound = { 'e' }
     *    array = { ' a', 'b', 'c', 'd' }
     *    result => -1
     * </pre>
     *
     * </li> </ol>
     *
     * @param toBeFound the subarray to search
     * @param array the array to be searched
     * @param start the starting index
     * @return the first index in the array for which the toBeFound array is a matching subarray following the case rule
     * starting at the index start, -1 otherwise
     * @throws NullPointerException if array is null or toBeFound is null
     * @since 3.2
     */
    public static int indexOf(final char[] toBeFound, final char[] array, final int start) {
        return indexOf(toBeFound, array, start, array.length);
    }

    /**
     * Answers the first index in the array for which the toBeFound array is a matching subarray following the case rule
     * starting at the index start. Answers -1 if no match is found. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    toBeFound = { 'c' }
     *    array = { ' a', 'b', 'c', 'd' }
     *    result => 2
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    toBeFound = { 'e' }
     *    array = { ' a', 'b', 'c', 'd' }
     *    result => -1
     * </pre>
     *
     * </li> </ol>
     *
     * @param toBeFound the subarray to search
     * @param array the array to be searched
     * @param start the starting index (inclusive)
     * @param end the end index (exclusive)
     * @return the first index in the array for which the toBeFound array is a matching subarray following the case rule
     * starting at the index start, -1 otherwise
     * @throws NullPointerException if array is null or toBeFound is null
     * @since 3.2
     */
    public static int indexOf(final char[] toBeFound, final char[] array, final int start, final int end) {
        final int toBeFoundLength = toBeFound.length;
        if (toBeFoundLength > end || start < 0)
            return -1;
        if (toBeFoundLength == 0)
            return 0;
        if (toBeFoundLength == end) {
            for (int i = start; i < end; i++) {
                if (array[i] != toBeFound[i])
                    return -1;
            }
            return 0;
        }
        arrayLoop: for (int i = start, max = end - toBeFoundLength + 1; i < max; i++) {
            if (array[i] == toBeFound[0]) {
                for (int j = 1; j < toBeFoundLength; j++) {
                    if (array[i + j] != toBeFound[j])
                        continue arrayLoop;
                }
                return i;
            }
        }
        return -1;
    }

    /**
     * Answers the first index in the array for which the corresponding character is equal to toBeFound starting the
     * search at index start. Answers -1 if no occurrence of this character is found. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    toBeFound = 'c'
     *    array = { ' a', 'b', 'c', 'd' }
     *    start = 2
     *    result => 2
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    toBeFound = 'c'
     *    array = { ' a', 'b', 'c', 'd' }
     *    start = 3
     *    result => -1
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    toBeFound = 'e'
     *    array = { ' a', 'b', 'c', 'd' }
     *    start = 1
     *    result => -1
     * </pre>
     *
     * </li> </ol>
     *
     * @param toBeFound the character to search
     * @param array the array to be searched
     * @param start the starting index
     * @return the first index in the array for which the corresponding character is equal to toBeFound, -1 otherwise
     * @throws NullPointerException if array is null
     * @throws ArrayIndexOutOfBoundsException if start is lower than 0
     */
    public static int indexOf(char toBeFound, char[] array, int start) {
        for (int i = start; i < array.length; i++)
            if (toBeFound == array[i])
                return i;
        return -1;
    }

    /**
     * Answers the first index in the array for which the corresponding character is equal to toBeFound starting the
     * search at index start and before the ending index. Answers -1 if no occurrence of this character is found. <br>
     * <br> For example: <ol> <li>
     *
     * <pre>
     *    toBeFound = 'c'
     *    array = { ' a', 'b', 'c', 'd' }
     *    start = 2
     *    result => 2
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    toBeFound = 'c'
     *    array = { ' a', 'b', 'c', 'd' }
     *    start = 3
     *    result => -1
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    toBeFound = 'e'
     *    array = { ' a', 'b', 'c', 'd' }
     *    start = 1
     *    result => -1
     * </pre>
     *
     * </li> </ol>
     *
     * @param array the array to be searched
     * @param start the starting index (inclusive)
     * @param end the ending index (exclusive)
     * @return the first index in the array for which the corresponding character is equal to toBeFound, -1 otherwise
     * @throws NullPointerException if array is null
     * @throws ArrayIndexOutOfBoundsException if start is lower than 0 or ending greater than array length
     * @since 3.2
     */
    public static int indexOf(char[] array, int start, int end) {

        for (int i = start; i < end; i++)
            if ('$' == array[i])
                return i;
        return -1;
    }

    /**
     * Answers the last index in the array for which the corresponding character is equal to toBeFound starting from the
     * end of the array. Answers -1 if no occurrence of this character is found. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    toBeFound = 'c'
     *    array = { ' a', 'b', 'c', 'd' , 'c', 'e' }
     *    result => 4
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    toBeFound = 'e'
     *    array = { ' a', 'b', 'c', 'd' }
     *    result => -1
     * </pre>
     *
     * </li> </ol>
     *
     * @param toBeFound the character to search
     * @param array the array to be searched
     * @return the last index in the array for which the corresponding character is equal to toBeFound starting from the
     * end of the array, -1 otherwise
     * @throws NullPointerException if array is null
     */
    public static int lastIndexOf(char toBeFound, char[] array) {
        for (int i = array.length; --i >= 0;)
            if (toBeFound == array[i])
                return i;
        return -1;
    }

    /**
     * Return the int value represented by the designated subpart of array. The calculation of the result for
     * single-digit positive integers is optimized in time.
     *
     * @param array the array within which the int value is to be parsed
     * @param start first character of the int value in array
     * @param length length of the int value in array
     * @return the int value of a subpart of array
     * @throws NumberFormatException if the designated subpart of array does not parse to an int
     * @since 3.4
     */
    public static int parseInt(char[] array, int start, int length) throws NumberFormatException {
        if (length == 1) {
            int result = array[start] - '0';
            if (result < 0 || result > 9) {
                throw new NumberFormatException("invalid digit"); //$NON-NLS-1$
            }
            return result;
        } else {
            return Integer.parseInt(new String(array, start, length));
        }
    }

    /**
     * Answers true if the given name starts with the given prefix, false otherwise. The comparison is case sensitive.
     * <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    prefix = { 'a' , 'b' }
     *    name = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    result => true
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    prefix = { 'a' , 'c' }
     *    name = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    result => false
     * </pre>
     *
     * </li> </ol>
     *
     * @param name the given name
     * @return true if the given name starts with the given prefix, false otherwise
     * @throws NullPointerException if the given name is null or if the given prefix is null
     */
    public static boolean prefixEquals(char[] name) {
        int max
            = com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.AbstractCommentParser.TAG_SNIPPET.length;
        if (name.length < max)
            return false;
        for (int i = max; --i >= 0;) // assumes the prefix is not larger than the name
            if (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.AbstractCommentParser.TAG_SNIPPET[i]
                != name[i])
                return false;
        return true;
    }

    /**
     * Replace all occurrence of the character to be replaced with the replacement character in the given array. <br>
     * <br> For example: <ol> <li>
     *
     * <pre>
     *    array = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    toBeReplaced = 'b'
     *    replacementChar = 'a'
     *    result => No returned value, but array is now equals to { 'a' , 'a', 'a', 'a', 'a', 'a' }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    array = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    toBeReplaced = 'c'
     *    replacementChar = 'a'
     *    result => No returned value, but array is now equals to { 'a' , 'b', 'b', 'a', 'b', 'a' }
     * </pre>
     *
     * </li> </ol>
     *
     * @param array the given array
     * @param toBeReplaced the character to be replaced
     * @param replacementChar the replacement character
     * @throws NullPointerException if the given array is null
     */
    public static void replace(char[] array, char toBeReplaced, char replacementChar) {
        if (toBeReplaced != replacementChar) {
            for (int i = 0, max = array.length; i < max; i++) {
                if (array[i] == toBeReplaced)
                    array[i] = replacementChar;
            }
        }
    }

    /**
     * Answers a new array of characters with substitutions. No side-effect is operated on the original array, in case
     * no substitution happened, then the result is the same as the original one. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    array = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    toBeReplaced = { 'b' }
     *    replacementChar = { 'a', 'a' }
     *    result => { 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    array = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    toBeReplaced = { 'c' }
     *    replacementChar = { 'a' }
     *    result => { 'a' , 'b', 'b', 'a', 'b', 'a' }
     * </pre>
     *
     * </li> </ol>
     *
     * @param array the given array
     * @param toBeReplaced characters to be replaced
     * @param replacementChars the replacement characters
     * @return a new array of characters with substitutions or the given array if none
     * @throws NullPointerException if the given array is null
     */
    public static char[] replace(char[] array, char[] toBeReplaced, char[] replacementChars) {
        int max = array.length;
        int replacedLength = toBeReplaced.length;
        int replacementLength = replacementChars.length;

        int[] starts = new int[5];
        int occurrenceCount = 0;

        if (!equals(toBeReplaced, replacementChars)) {
            for (int i = 0; i < max;) {
                int index = indexOf(toBeReplaced, array, i);
                if (index == -1) {
                    i = max; // end
                    continue;
                }
                if (occurrenceCount == starts.length) {
                    System.arraycopy(starts, 0, starts = new int[occurrenceCount * 2], 0, occurrenceCount);
                }
                starts[occurrenceCount++] = index;
                i = index + replacedLength;
            }
        }
        if (occurrenceCount == 0)
            return array;
        char[] result = new char[max + occurrenceCount * (replacementLength - replacedLength)];
        int inStart = 0, outStart = 0;
        for (int i = 0; i < occurrenceCount; i++) {
            int offset = starts[i] - inStart;
            System.arraycopy(array, inStart, result, outStart, offset);
            inStart += offset;
            outStart += offset;
            System.arraycopy(replacementChars, 0, result, outStart, replacementLength);
            inStart += replacedLength;
            outStart += replacementLength;
        }
        System.arraycopy(array, inStart, result, outStart, max - inStart);
        return result;
    }

    /**
     * Return a new array which is the split of the given array using the given divider and trimming each subarray to
     * remove whitespaces equals to ' '. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    divider = 'b'
     *    array = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    result => { { 'a' }, {  }, { 'a' }, { 'a' } }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    divider = 'c'
     *    array = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    result => { { 'a', 'b', 'b', 'a', 'b', 'a' } }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    divider = 'b'
     *    array = { 'a' , ' ', 'b', 'b', 'a', 'b', 'a' }
     *    result => { { 'a' }, {  }, { 'a' }, { 'a' } }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    divider = 'c'
     *    array = { ' ', ' ', 'a' , 'b', 'b', 'a', 'b', 'a', ' ' }
     *    result => { { 'a', 'b', 'b', 'a', 'b', 'a' } }
     * </pre>
     *
     * </li> </ol>
     *
     * @param divider the given divider
     * @param array the given array
     * @return a new array which is the split of the given array using the given divider and trimming each subarray to
     * remove whitespaces equals to ' '
     */
    public static char[][] splitAndTrimOn(char divider, char[] array) {
        int length = array == null ? 0 : array.length;
        if (length == 0)
            return NO_CHAR_CHAR;

        int wordCount = 1;
        for (int i = 0; i < length; i++)
            if (array[i] == divider)
                wordCount++;
        char[][] split = new char[wordCount][];
        int last = 0, currentWord = 0;
        for (int i = 0; i < length; i++) {
            if (array[i] == divider) {
                int start = last, end = i - 1;
                while (start < i && array[start] == ' ')
                    start++;
                while (end > start && array[end] == ' ')
                    end--;
                split[currentWord] = new char[end - start + 1];
                System.arraycopy(array, start, split[currentWord++], 0, end - start + 1);
                last = i + 1;
            }
        }
        int start = last, end = length - 1;
        while (start < length && array[start] == ' ')
            start++;
        while (end > start && array[end] == ' ')
            end--;
        split[currentWord] = new char[end - start + 1];
        System.arraycopy(array, start, split[currentWord++], 0, end - start + 1);
        return split;
    }

    /**
     * Return a new array which is the split of the given array using the given divider. <br> <br> For example: <ol>
     * <li>
     *
     * <pre>
     *    divider = 'b'
     *    array = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    result => { { 'a' }, {  }, { 'a' }, { 'a' } }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    divider = 'c'
     *    array = { 'a' , 'b', 'b', 'a', 'b', 'a' }
     *    result => { { 'a', 'b', 'b', 'a', 'b', 'a' } }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    divider = 'c'
     *    array = { ' ', ' ', 'a' , 'b', 'b', 'a', 'b', 'a', ' ' }
     *    result => { { ' ', 'a', 'b', 'b', 'a', 'b', 'a', ' ' } }
     * </pre>
     *
     * </li> </ol>
     *
     * @param divider the given divider
     * @param array the given array
     * @return a new array which is the split of the given array using the given divider
     */
    public static char[][] splitOn(char divider, char[] array) {
        int length = array == null ? 0 : array.length;
        if (length == 0)
            return NO_CHAR_CHAR;

        int wordCount = 1;
        for (int i = 0; i < length; i++)
            if (array[i] == divider)
                wordCount++;
        char[][] split = new char[wordCount][];
        int last = 0, currentWord = 0;
        for (int i = 0; i < length; i++) {
            if (array[i] == divider) {
                split[currentWord] = new char[i - last];
                System.arraycopy(array, last, split[currentWord++], 0, i - last);
                last = i + 1;
            }
        }
        split[currentWord] = new char[length - last];
        System.arraycopy(array, last, split[currentWord], 0, length - last);
        return split;
    }

    /**
     * Answers a new array which is a copy of the given array starting at the given start and ending at the given end.
     * The given start is inclusive and the given end is exclusive. Answers null if start is greater than end, if start
     * is lower than 0 or if end is greater than the length of the given array. If end equals -1, it is converted to the
     * array length. <br> <br> For example: <ol> <li>
     *
     * <pre>
     *    array = { 'a' , 'b' }
     *    start = 0
     *    end = 1
     *    result => { 'a' }
     * </pre>
     *
     * </li> <li>
     *
     * <pre>
     *    array = { 'a', 'b' }
     *    start = 0
     *    end = -1
     *    result => { 'a' , 'b' }
     * </pre>
     *
     * </li> </ol>
     *
     * @param array the given array
     * @param start the given starting index
     * @param end the given ending index
     * @return a new array which is a copy of the given array starting at the given start and ending at the given end
     * @throws NullPointerException if the given array is null
     */
    public static char[] subarray(char[] array, int start, int end) {
        if (end == -1)
            end = array.length;
        if (start > end)
            return null;
        if (start < 0)
            return null;
        if (end > array.length)
            return null;

        char[] result = new char[end - start];
        System.arraycopy(array, start, result, 0, end - start);
        return result;
    }

}
