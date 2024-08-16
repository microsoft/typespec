// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.Range;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * The raw editor containing the current files being customized.
 */
public final class Editor {
    private final Path rootDir;
    private final Map<String, String> contents;
    private final Map<String, List<String>> lines;
    private final Map<String, Path> paths;

    /**
     * Creates an editor instance with the file contents and the root directory path.
     *
     * @param contents the map from file relative paths (starting with "src/main/java") and file contents
     * @param rootDir the root directory path containing the files
     */
    public Editor(Map<String, String> contents, Path rootDir) {
        this.contents = new HashMap<>(contents);
        this.lines = new HashMap<>();
        this.paths = new HashMap<>();
        this.rootDir = rootDir;
        for (Map.Entry<String, String> content : contents.entrySet()) {
            addFile(content.getKey(), content.getValue());
        }

    }

    /**
     * Gets the mapping from file relative paths (starting with "src/main/java") to file contents.
     *
     * @return the mapping
     */
    public Map<String, String> getContents() {
        return contents;
    }

    /**
     * Adds a new file.
     *
     * @param name the relative path of the file, starting with "src/main/java"
     * @param content the file content
     */
    public void addFile(String name, String content) {
        addOrReplaceFile(name, content, false);
    }

    /**
     * Replaces an existing file with new content.
     *
     * @param name The relative path of the file, starting with "src/main/java".
     * @param content The content of the file.
     */
    public void replaceFile(String name, String content) {
        addOrReplaceFile(name, content, true);
    }

    private void addOrReplaceFile(String name, String content, boolean isReplace) {
        Path newFilePath = Paths.get(rootDir.toString(), name);
        File newFile = newFilePath.toFile();
        if (!newFile.getParentFile().exists()) {
            newFile.getParentFile().mkdirs();
        }

        try {
            boolean fileCreated = newFile.createNewFile();

            try (BufferedWriter writer = Files.newBufferedWriter(newFile.toPath())) {
                writer.write(content);
            }

            if (fileCreated || isReplace) {
                contents.put(name, content);
                lines.put(name, splitContentIntoLines(content));
                paths.put(name, newFilePath);
            }
        } catch (IOException e) {
            throw new RuntimeException();
        }
    }

    /**
     * Removes a file.
     *
     * @param name the relative file path, starting with "src/main/java"
     */
    public void removeFile(String name) {
        contents.remove(name);
        lines.remove(name);
        paths.get(name).toFile().delete();
        paths.remove(name);
    }

    /**
     * Gets the content of a file.
     *
     * @param name the relative path of a file, starting with "src/main/java"
     * @return the file content
     */
    public String getFileContent(String name) {
        return contents.get(name);
    }

    /**
     * Gets the file content split into lines.
     *
     * @param name the relative path of a file, starting with "src/main/java"
     * @return the file content split into lines
     */
    public List<String> getFileLines(String name) {
        return lines.get(name);

    }

    /**
     * Gets a line in a file.
     *
     * @param name the relative path of a file, starting with "src/main/java"
     * @param line the line number
     * @return the file content in this line
     */
    public String getFileLine(String name, int line) {
        return lines.get(name).get(line);
    }

    /**
     * Inserts a blank line at a given line number.
     *
     * @param fileName the relative path of a file, starting with "src/main/java"
     * @param line the line number to insert a new line
     * @param indented if the line should be indented at the same level as the next line
     * @return the position of the cursor after indentation (if indented) in this line
     */
    public Position insertBlankLine(String fileName, int line, boolean indented) {
        if (!indented) {
            return insertBlankLineWithIndent(fileName, line, 0);
        } else {
            int indentAmount = Utils.getIndent(lines.get(fileName).get(line)).length();

            return insertBlankLineWithIndent(fileName, line, indentAmount);
        }
    }

    public Position insertBlankLineWithIndent(String fileName, int line, int indentAmount) {
        String indentation = IntStream.range(0, indentAmount).mapToObj(ignored -> " ").collect(Collectors.joining());
        lines.get(fileName).add(line, indentation);
        contents.put(fileName, joinLinesIntoContent(lines.get(fileName)));
        return new Position(line, indentation.length());
    }

    /**
     * Replaces a chunk of a text with a new text in the file.
     *
     * @param fileName the relative path of a file, starting with "src/main/java"
     * @param start the starting position to replace, inclusive
     * @param end the ending position to replace, exclusive
     * @param newContent the new content to replace the chunk
     */
    public void replace(String fileName, Position start, Position end, String newContent) {
        replaceWithIndentedContent(fileName, start, end, newContent, 0);
    }

    public void replaceWithIndentedContent(String fileName, Position start, Position end, String newContent,
        int newLineIndent) {
        String indent = IntStream.range(0, newLineIndent).mapToObj(ignored -> " ").collect(Collectors.joining());
        StringBuilder stringBuilder = new StringBuilder(4096);
        List<String> lineContent = lines.get(fileName);

        // Copy lines until the start of the change is reached.
        for (int i = 0; i != start.getLine(); i++) {
            Utils.writeLine(stringBuilder, lineContent.get(i));
        }

        // Copy until the start of the change.
        stringBuilder.append(lineContent.get(start.getLine()), 0, start.getCharacter());

        List<String> replacementLineContent = splitContentIntoLines(newContent);

        // Add the change.
        if (replacementLineContent.size() > 0) {
            for (int i = 0; i != replacementLineContent.size() - 1; i++) {
                if (i > 0) {
                    stringBuilder.append(indent);
                }

                Utils.writeLine(stringBuilder, replacementLineContent.get(i));
            }

            stringBuilder.append(indent).append(replacementLineContent.get(replacementLineContent.size() - 1));
        }

        Utils.writeLine(stringBuilder, lineContent.get(end.getLine()).substring(end.getCharacter()));

        // Copy the rest of the file until its end.
        for (int i = end.getLine() + 1; i != lineContent.size(); i++) {
            Utils.writeLine(stringBuilder, lineContent.get(i));
        }

        contents.put(fileName, stringBuilder.toString());
        lines.put(fileName, splitContentIntoLines(contents.get(fileName)));
        try (BufferedWriter fileWriter = Files.newBufferedWriter(paths.get(fileName))) {
            fileWriter.write(contents.get(fileName));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Renames a file. This simply renames the file, without renaming any class content.
     *
     * @param fileName the original relative path of a file, starting with "src/main/java"
     * @param newName the new relative path of the file, starting with "src/main/java"
     */
    public void renameFile(String fileName, String newName) {
        contents.put(newName, contents.remove(fileName));
        lines.put(newName, lines.remove(fileName));
        Path path = paths.remove(fileName);
        Path newPath = Paths.get(rootDir.toString(), newName);
        path.toFile().renameTo(newPath.toFile());
        paths.put(newName, newPath);
    }

    /**
     * Searches all occurrences of a text in the file.
     *
     * @param fileName the relative path of a file, starting with "src/main/java"
     * @param text the text to search
     * @return the list of ranges containing the occurrences
     */
    public List<Range> searchText(String fileName, String text) {
        if (!lines.containsKey(fileName)) {
            return null;
        } else {
            List<Range> occurrences = new ArrayList<>();
            for (int i = 0; i != lines.get(fileName).size(); i++) {
                String line = lines.get(fileName).get(i);
                if (line.contains(text)) {
                    int start = line.indexOf(text);
                    while (start != -1) {
                        int end = start + text.length();
                        occurrences.add(new Range(new Position(i, start), new Position(i, end)));
                        start = line.indexOf(text, end);
                    }
                }
            }
            return occurrences;
        }
    }

    /**
     * Searches the first occurrence of a text in the file.
     *
     * @param fileName the relative path of a file, starting with "src/main/java"
     * @param text the text to search
     * @return the range containing the occurrence
     */
    public Range searchTextFirstOccurrence(String fileName, String text) {
        List<Range> ranges = searchText(fileName, text);
        if (ranges != null && !ranges.isEmpty()) {
            return ranges.get(0);
        }
        return null;
    }

    /**
     * Gets the text content in a range in the file. The lines will be joined with an optional delimiter. If the
     * delimiter is null, the lines will be joined with line endings.
     *
     * @param fileName the relative path of a file, starting with "src/main/java"
     * @param range the range to convert to text
     * @param delimiter the optional delimiter described above
     * @return the text in the range
     */
    public String getTextInRange(String fileName, Range range, String delimiter) {
        return getTextInRange(fileName, range, delimiter, str -> str);
    }

    /**
     * Gets the text content in a range in the file.
     * <p>
     * If {@code delimiter} isn't null the lines will be joined using the delimiter. Otherwise, the lines will be joined
     * using newline.
     * <p>
     * If {@code lineCleaner} isn't null each line of content read from the file will use the line cleaner before adding
     * it to the result.
     *
     * @param fileName The name of the file where content will be read.
     * @param range The range in the file where content will be read.
     * @param delimiter Optional delimiter to join read lines of the file.
     * @param lineCleaner Optional function that will cleanse each line of the file that is read.
     * @return The text in the range.
     */
    public String getTextInRange(String fileName, Range range, String delimiter, Function<String, String> lineCleaner) {
        StringBuilder stringBuilder = new StringBuilder(4096);
        for (int line = range.getStart().getLine(); line <= range.getEnd().getLine(); line++) {
            String lineContent = getFileLine(fileName, line);
            int truncateIndex = 0;
            if (line == range.getStart().getLine()) {
                lineContent = lineContent.substring(range.getStart().getCharacter());
                truncateIndex = range.getStart().getCharacter();
            }

            if (line == range.getEnd().getLine()) {
                lineContent = lineContent.substring(0, range.getEnd().getCharacter() - truncateIndex);
            }

            if (lineCleaner != null) {
                lineContent = lineCleaner.apply(lineContent);
            }

            if (delimiter == null) {
                Utils.writeLine(stringBuilder, lineContent);
            } else {
                if (stringBuilder.length() == 0) {
                    stringBuilder.append(lineContent);
                } else {
                    stringBuilder.append(delimiter).append(lineContent);
                }
            }
        }

        return stringBuilder.toString();
    }

    private static List<String> splitContentIntoLines(String content) {
        List<String> res = new ArrayList<>();
        Scanner scanner = new Scanner(content);
        while (scanner.hasNextLine()) {
            res.add(scanner.nextLine());
        }
        if (content.endsWith("\n")) {
            res.add("");
        }
        return res;
    }

    private static String joinLinesIntoContent(List<String> lines) {
        return String.join(System.lineSeparator(), lines);
    }
}
