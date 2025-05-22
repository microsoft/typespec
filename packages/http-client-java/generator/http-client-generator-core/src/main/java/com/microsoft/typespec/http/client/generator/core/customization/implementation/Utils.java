// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization.implementation;

import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import java.io.File;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Utils {
    /**
     * This pattern determines the indentation of the passed string. Effectively it creates a group containing all
     * spaces before the first word character.
     */
    public static final Pattern INDENT_DETERMINATION_PATTERN = Pattern.compile("^(\\s*).*$");

    /**
     * This pattern matches anything then the space.
     */
    public static final Pattern ANYTHING_THEN_SPACE_PATTERN = Pattern.compile(".* ");

    public static void deleteDirectory(File directoryToBeDeleted) {
        File[] allContents = directoryToBeDeleted.listFiles();
        if (allContents != null) {
            for (File file : allContents) {
                deleteDirectory(file);
            }
        }
        directoryToBeDeleted.delete();
    }

    public static boolean isNullOrEmpty(CharSequence charSequence) {
        return charSequence == null || charSequence.length() == 0;
    }

    public static <T> boolean isNullOrEmpty(T[] array) {
        return array == null || array.length == 0;
    }

    public static <T> boolean isNullOrEmpty(Iterable<T> iterable) {
        return (iterable == null || !iterable.iterator().hasNext());
    }

    public static <T, S> S returnIfPresentOrThrow(Optional<T> optional, Function<T, S> returnFormatter,
        Supplier<RuntimeException> orThrow) {
        return optional.map(returnFormatter).orElseThrow(orThrow);
    }

    public static void writeLine(StringBuilder stringBuilder, String text) {
        stringBuilder.append(text).append(System.lineSeparator());
    }

    /**
     * Walks down the lines of a file until the line matches a predicate.
     *
     * @param editor The editor containing the file's information.
     * @param fileName The name of the file.
     * @param startLine The line to start walking.
     * @param linePredicate The predicate that determines when a matching line is found.
     * @return The first line that matches the predicate. If no line in the file matches the predicate {@code -1} is
     * returned.
     */
    public static int walkDownFileUntilLineMatches(Editor editor, String fileName, int startLine,
        Predicate<String> linePredicate) {
        return walkFileUntilLineMatches(editor, fileName, startLine, linePredicate);
    }

    private static int walkFileUntilLineMatches(Editor editor, String fileName, int startLine,
        Predicate<String> linePredicate) {
        int matchingLine = -1;

        List<String> fileLines = editor.getFileLines(fileName);
        for (int line = startLine; line < fileLines.size(); line++) {
            if (linePredicate.test(fileLines.get(line))) {
                matchingLine = line;
                break;
            }
        }

        return matchingLine;
    }

    /**
     * Removes the leading {@literal @} in an annotation name, if it exists.
     *
     * @param annotationName The annotation name.
     * @return The annotation with any leading {@literal @} removed.
     */
    public static String cleanAnnotationName(String annotationName) {
        return annotationName.startsWith("@") ? annotationName.substring(1) : annotationName;
    }

    public static String getIndent(String content) {
        Matcher matcher = INDENT_DETERMINATION_PATTERN.matcher(content);
        return matcher.matches() ? matcher.group(1) : "";
    }

    public static boolean isWindows() {
        String osName = System.getProperty("os.name");
        return osName != null && osName.startsWith("Windows");
    }

    public static boolean isMac() {
        String osName = System.getProperty("os.name");
        return osName != null && (osName.startsWith("Mac") || osName.startsWith("Darwin"));
    }

    private Utils() {
    }
}
