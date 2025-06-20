// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.stream.Collectors;

/**
 * The raw editor containing the current files being customized.
 */
public final class Editor {
    private final Map<String, String> contents;
    private final Map<String, List<String>> lines;

    /**
     * Creates an editor instance with the file contents and the root directory path.
     *
     * @param contents the map from file relative paths (starting with "src/main/java") and file contents
     */
    public Editor(Map<String, String> contents) {
        this.contents = new HashMap<>(contents);
        this.lines = new HashMap<>();
        for (Map.Entry<String, String> entry : contents.entrySet()) {
            lines.put(entry.getKey(), splitContentIntoLines(entry.getValue()));
        }
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
            lines.put(name, splitContentIntoLines(content));
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

}
