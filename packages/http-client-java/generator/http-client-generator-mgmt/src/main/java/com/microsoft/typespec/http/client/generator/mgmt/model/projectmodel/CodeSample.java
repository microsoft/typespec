// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import org.slf4j.Logger;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class CodeSample {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), CodeSample.class);

    private static final String TEST_ANNOTATION = "@Test";
    private static final String EMBEDME_START_COMMENT = "// @embedmeStart";
    private static final String EMBEDME_END_COMMENT = "// @embedmeEnd";

    private String code;

    protected CodeSample() {
    }

    public static CodeSample fromTestFile(Path testFilePath) {
        // the assumption is there is a embedme block in a @Test method
        // for now, only extract first block

        CodeSample codeSample = new CodeSample();

        try (BufferedReader reader = Files.newBufferedReader(testFilePath, StandardCharsets.UTF_8)) {
            List<String> codeLines = new ArrayList<>();

            boolean testMethodBegin = false;
            boolean embedmeBlockBegin = false;
            String testMethodIndent = "";
            String embedmeBlockIndent = "";
            for (String line : reader.lines().collect(Collectors.toList())) {
                if (!testMethodBegin) {
                    if (line.trim().equals(TEST_ANNOTATION)) {
                        // first get inside @Test method

                        testMethodBegin = true;
                        int indent = line.indexOf(TEST_ANNOTATION);
                        char[] chars = new char[indent];
                        Arrays.fill(chars, ' ');
                        testMethodIndent = String.valueOf(chars);
                    }
                } else if (!embedmeBlockBegin) {
                    if (line.startsWith(testMethodIndent + "}")) {
                        // method ends without embedme block

                        testMethodBegin = false;
                        // continue
                    } else if (line.trim().equals(EMBEDME_START_COMMENT)) {
                        // next get inside embedme block, similar to https://github.com/zakhenry/embedme/issues/48

                        embedmeBlockBegin = true;
                        int indent = line.indexOf(EMBEDME_START_COMMENT);
                        char[] chars = new char[indent];
                        Arrays.fill(chars, ' ');
                        embedmeBlockIndent = String.valueOf(chars);
                    }
                } else  {
                    if (line.startsWith(embedmeBlockIndent + EMBEDME_END_COMMENT)) {
                        // embedme block ends

                        embedmeBlockBegin = false;
                        break;
                        // for now, only extract one block
                    } else {
                        // extract the code line (except Assertions)

                        if (!line.trim().startsWith("Assertions.") && !line.trim().startsWith("assert")) {
                            codeLines.add(line);
                        }
                    }
                }
            }

            if (!codeLines.isEmpty() && !embedmeBlockBegin) {
                codeLines = removeIndent(codeLines);
                codeSample.code = String.join("\n", codeLines) + "\n";

                LOGGER.info("Read {} lines of code sample from test file '{}'", codeLines.size(), testFilePath);
            }
        } catch (IOException e) {
            LOGGER.warn("Failed to read '" + testFilePath + "'", e);
        }

        return codeSample;
    }

    public String getCode() {
        return code;
    }

    private static List<String> removeIndent(List<String> codeLines) {
        int minIndent = Integer.MAX_VALUE;
        for (String line : codeLines) {
            String trimmedLine = line.trim();
            if (!trimmedLine.isEmpty()) {
                int indent = line.indexOf(trimmedLine);
                if (indent < minIndent) {
                    minIndent = indent;
                }
            }
        }

        List<String> lines = codeLines;
        if (minIndent > 0) {
            lines = new ArrayList<>();
            for (String line : codeLines) {
                if (line.length() > minIndent) {
                    lines.add(line.substring(minIndent));
                } else {
                    lines.add("");
                }
            }
        }
        return lines;
    }
}
