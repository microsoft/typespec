// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentExample;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.postprocessor.implementation.CodeFormatterUtil;

import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

public class SampleTemplate {

    private final StringBuilder builder = new StringBuilder();

    private static final String NEW_LINE = System.lineSeparator();

    public String write(List<FluentExample> examples, List<JavaFile> sampleJavaFiles) {
        assert examples.size() == sampleJavaFiles.size();

        // clean up copyright etc.
        List<Map.Entry<String, String>> javaFiles = sampleJavaFiles.stream()
                .map(e -> Map.entry(e.getFilePath(), cleanJavaFile(e)))
                .collect(Collectors.toList());
        // format code
        List<String> javaFileContents;
        try {
            javaFileContents = CodeFormatterUtil.formatCode(javaFiles);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        heading("Code snippets and samples", 1);

        List<String> sectionNames = new ArrayList<>();
        String groupName = null;
        for (FluentExample example : examples) {
            if (!Objects.equals(groupName, example.getGroupName())) {
                newLine();
                heading(example.getGroupName(), 2);
            }

            groupName = example.getGroupName();
            String sectionName = example.getGroupName() + "_" + example.getMethodName();
            sectionNames.add(sectionName);

            unorderedList(linkSection(example.getMethodName(), sectionName));
        }

        int index = 0;
        for (String javaFileContent : javaFileContents) {
            String sectionName = sectionNames.get(index);
            heading(sectionName, 3);

            builder.append("```java");
            newLine();
            builder.append(javaFileContent);
            builder.append("```");
            newLine();
            newLine();

            ++index;
        }

        return builder.toString();
    }

    private static String cleanJavaFile(JavaFile javaFile) {
        String content = javaFile.getContents().toString();

        // remove copyright and package statement
        List<String> formattedLines = new ArrayList<>();
        String[] lines = content.split("\r?\n", -1);
        boolean skipCopyright = true;
        for (String line : lines) {
            if (skipCopyright) {
                if (!line.trim().isEmpty() && !line.trim().startsWith("//") && !line.trim().startsWith("package")) {
                    skipCopyright = false;
                }
            }

            if (!skipCopyright) {
                formattedLines.add(line);
            }
        }
        return String.join(System.lineSeparator(), formattedLines);
    }

    private static String link(String text, URL url) {
        return '[' + text + ']' + '(' + url.toString() + ')';
    }

    private static String linkSection(String text, String section) {
        return '[' + text + ']' + "(#" + section.toLowerCase(Locale.ROOT) + ')';
    }

    private void heading(String text, int level) {
        builder.append("#".repeat(Math.max(0, level)));
        builder.append(' ').append(text).append(NEW_LINE).append(NEW_LINE);
    }

    private void unorderedList(String text) {
        builder.append("- ").append(text).append(NEW_LINE);
    }

    private void newLine() {
        builder.append(NEW_LINE);
    }
}
