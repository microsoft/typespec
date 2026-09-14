// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * The raw editor containing the current files being customized.
 */
public final class Editor {
    private final Map<String, String> contents;
    private final Map<String, List<String>> lines;
    private final Map<String, ParsedFile> parsedFiles = new HashMap<>();

    /**
     * Creates an editor instance with the file contents and the root directory path.
     *
     * @param contents the map from file relative paths (starting with "src/main/java") and file contents
     */
    public Editor(Map<String, String> contents) {
        this.contents = new LinkedHashMap<>(contents);
        this.lines = new HashMap<>();
    }

    /**
     * Checks if the package exists in the editor.
     *
     * @param packageName the package name
     * @return Whether the package exists
     */
    public boolean packageExists(String packageName) {
        String toFind = "src/main/java/" + packageName.replace('.', '/') + "/";
        return contents.keySet().stream().anyMatch(fileName -> fileName.startsWith(toFind));
    }

    /**
     * Checks if a class exists in the editor.
     *
     * @param packageName the package name of the class
     * @param className the class name
     * @return Whether the class exists
     */
    public boolean classExists(String packageName, String className) {
        String fileName = "src/main/java/" + packageName.replace('.', '/') + "/" + className + ".java";
        return contents.containsKey(fileName);
    }

    /**
     * Lists all classes in a package.
     *
     * @param packageName the package name
     * @return the list of classes in the package
     */
    public List<String> classesInPackage(String packageName) {
        String packagePath = "src/main/java/" + packageName.replace(".", "/") + "/";
        return contents.keySet()
            .stream()
            .filter(fileName -> fileName.startsWith(packagePath))
            .map(fileName -> fileName.substring(packagePath.length(), fileName.length() - 5))
            .filter(className -> !className.contains("/"))
            .collect(Collectors.toList());
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
     * Gets the shared AST for the current file content. Text replacements invalidate the cached parse.
     * Commit AST changes with {@link #setCompilationUnit(String, CompilationUnit)} before reading the file as text.
     *
     * @param name the relative file path
     * @return the parsed compilation unit
     */
    public CompilationUnit getCompilationUnit(String name) {
        String content = contents.get(name);
        ParsedFile parsedFile = parsedFiles.get(name);
        if (parsedFile == null || !parsedFile.content.equals(content)) {
            parsedFile = new ParsedFile(content, StaticJavaParser.parse(content), false);
            parsedFiles.put(name, parsedFile);
        }
        return parsedFile.compilationUnit;
    }

    /**
     * Gets an existing AST without parsing a file that has not needed AST processing.
     *
     * @param name the relative file path
     * @return the cached compilation unit, or null if the current text has not been parsed
     */
    public CompilationUnit getCachedCompilationUnit(String name) {
        ParsedFile parsedFile = parsedFiles.get(name);
        return parsedFile != null && parsedFile.content.equals(contents.get(name)) ? parsedFile.compilationUnit : null;
    }

    /**
     * Indicates whether AST edits have made the original source positions unsuitable for text replacements.
     *
     * @param name the relative file path
     * @return whether the current AST has been edited
     */
    public boolean isCompilationUnitModified(String name) {
        ParsedFile parsedFile = parsedFiles.get(name);
        return parsedFile != null && parsedFile.modified && parsedFile.content.equals(contents.get(name));
    }

    /**
     * Releases a cached AST after its final use without discarding the file content.
     *
     * @param name the relative file path
     */
    public void releaseCompilationUnit(String name) {
        parsedFiles.remove(name);
    }

    /**
     * Updates the file content while retaining the edited AST for subsequent processing.
     *
     * @param name the relative file path
     * @param compilationUnit the edited compilation unit
     */
    public void setCompilationUnit(String name, CompilationUnit compilationUnit) {
        String content = compilationUnit.toString();
        if (compilationUnit.getModule().isPresent()) {
            content = compilationUnit.getOrphanComments().stream().map(Object::toString).collect(Collectors.joining())
                + "\n" + content;
        }
        replaceFile(name, content);
        parsedFiles.put(name, new ParsedFile(content, compilationUnit, true));
    }

    void customizeAst(String name, Consumer<CompilationUnit> customization) {
        CompilationUnit compilationUnit = getCompilationUnit(name);
        try {
            customization.accept(compilationUnit);
            setCompilationUnit(name, compilationUnit);
        } catch (RuntimeException | Error exception) {
            parsedFiles.remove(name);
            throw exception;
        }
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
        if (isReplace || !contents.containsKey(name)) {
            contents.put(name, content);
            lines.remove(name);
            parsedFiles.remove(name);
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
        parsedFiles.remove(name);
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
        return contents.containsKey(name)
            ? lines.computeIfAbsent(name, fileName -> splitContentIntoLines(contents.get(fileName)))
            : null;
    }

    /**
     * Gets a line in a file.
     *
     * @param name the relative path of a file, starting with "src/main/java"
     * @param line the line number
     * @return the file content in this line
     */
    public String getFileLine(String name, int line) {
        return getFileLines(name).get(line);
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

    private static final class ParsedFile {
        private final String content;
        private final CompilationUnit compilationUnit;
        private final boolean modified;

        private ParsedFile(String content, CompilationUnit compilationUnit, boolean modified) {
            this.content = content;
            this.compilationUnit = compilationUnit;
            this.modified = modified;
        }
    }

}
