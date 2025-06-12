// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

import com.google.googlejavaformat.FormatterDiagnostic;
import com.google.googlejavaformat.java.FormatterException;
import com.google.googlejavaformat.java.RemoveUnusedImports;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.FileUtils;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.slf4j.Logger;

/**
 * Utility class that handles code formatting.
 */
public final class CodeFormatterUtil {

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format.
     * @param plugin The plugin to use to write the formatted files.
     */
    public static void formatCode(Map<String, String> files, NewPlugin plugin, Logger logger) {
        for (Map.Entry<String, String> file : formatCodeInternal(files.entrySet(), logger)) {
            plugin.writeFile(file.getKey(), file.getValue(), null);
        }
    }

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format. The entry is filename and content.
     * @return the files after format.
     * @throws RuntimeException If code formatting fails.
     */
    public static List<String> formatCode(Map<String, String> files) {
        return formatCodeInternal(files.entrySet(), null).stream()
            .map(Map.Entry::getValue)
            .collect(Collectors.toList());
    }

    @SuppressWarnings("DataFlowIssue")
    private static List<Map.Entry<String, String>> formatCodeInternal(Collection<Map.Entry<String, String>> files,
        Logger logger) {
        // First step to formatting code is to use the in-memory Google Java Formatter to remove unused imports.
        files = removeUnusedImports(files, logger);

        try {
            Path tmpDir = FileUtils.createTempDirectory("spotless" + UUID.randomUUID());

            for (Map.Entry<String, String> javaFile : files) {
                Path file = tmpDir.resolve(javaFile.getKey());
                Files.createDirectories(file.getParent());
                Files.writeString(file, javaFile.getValue());
            }

            Path pomPath = tmpDir.resolve("spotless-pom.xml");
            Files.copy(CodeFormatterUtil.class.getClassLoader().getResourceAsStream("readme/pom.xml"), pomPath);
            Files.copy(
                CodeFormatterUtil.class.getClassLoader()
                    .getResourceAsStream("readme/eclipse-format-azure-sdk-for-java.xml"),
                pomPath.resolveSibling("eclipse-format-azure-sdk-for-java.xml"));

            attemptMavenSpotless(pomPath);

            List<Map.Entry<String, String>> formattedFiles = new ArrayList<>(files.size());
            for (Map.Entry<String, String> javaFile : files) {
                Path file = tmpDir.resolve(javaFile.getKey());
                formattedFiles.add(new AbstractMap.SimpleEntry<>(javaFile.getKey(), Files.readString(file)));
            }

            // only delete the temporary directory if all files were formatted successfully
            Utils.deleteDirectory(tmpDir.toFile());

            return formattedFiles;
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    /*
     * In previous iterations of code formatting, we let Spotless use Google Java Formatter to remove unused imports.
     * This worked well when code was valid, but when there were errors Spotless would halt processing on the first
     * issue found. This meant that resolving issues were difficult, as it could take many iterations to resolve the
     * regressions introduced.
     *
     * This then resulted in a new design where when Spotless failed on the entire fileset we would run Spotless
     * individually on each file, and log the error message with the file content. This worked, but was tremendously
     * slow as it required running many Maven processes, one for each file.
     *
     * This new implementation takes a dependency on google-java-format to run Google Java Formatter ourselves. This
     * allows us to control error handling by processing all files, in-memory (much faster than letting Spotless run
     * Google Java Formatter), and capturing all issues before attempting Spotless formatting (which now excludes
     * unused import removal).
     */
    private static List<Map.Entry<String, String>> removeUnusedImports(Collection<Map.Entry<String, String>> files,
        Logger logger) {
        List<Map.Entry<String, String>> updatedFiles = new ArrayList<>(files.size());

        // Tracker for errors encountered while running Google Java Formatter.
        StringBuilder errorCapture = new StringBuilder();

        for (Map.Entry<String, String> file : files) {
            String content = file.getValue();
            try {
                // Use Google Java Formatter to remove unused imports.
                updatedFiles.add(
                    new AbstractMap.SimpleEntry<>(file.getKey(), RemoveUnusedImports.removeUnusedImports(content)));
            } catch (FormatterException ex) {
                String[] fileLines = content.split("\n");
                // Capture the error message and continue processing other files.
                for (FormatterDiagnostic diagnostic : ex.diagnostics()) {
                    appendDiagnosticError(errorCapture, diagnostic, file.getKey(), fileLines, logger);
                }
            }
            file.setValue(content);
        }

        if (errorCapture.length() > 0) {
            throw new IllegalStateException("Google Java Formatter encountered errors:\n" + errorCapture);
        }

        return updatedFiles;
    }

    private static void appendDiagnosticError(StringBuilder errorCapture, FormatterDiagnostic diagnostic,
        String fileName, String[] fileLines, Logger logger) {
        int lineNumber = diagnostic.line();
        int columnNumber = diagnostic.column();
        int startLine = Math.max(0, lineNumber - 3);
        int endLine = Math.min(fileLines.length - 1, lineNumber + 2);

        StringBuilder diagnosticMessageBuilder = new StringBuilder();
        diagnosticMessageBuilder.append("Error in file '")
            .append(fileName)
            .append("', ")
            .append(diagnostic)
            .append(":\n");

        for (int i = startLine; i <= endLine; i++) {
            String prefix = (i + 1) + ": ";
            diagnosticMessageBuilder.append(prefix).append(fileLines[i]).append("\n");
            if (i == lineNumber - 1) {
                diagnosticMessageBuilder.append(" ".repeat(columnNumber + prefix.length() - 1)).append("^\n");
            }
        }

        String diagnosticMessage = diagnosticMessageBuilder.toString();
        if (logger != null) {
            logger.error(diagnosticMessage);
        }
        errorCapture.append(diagnosticMessage);
    }

    private static void attemptMavenSpotless(Path pomPath) {
        String[] command;
        if (Utils.isWindows()) {
            command = new String[] { "cmd", "/c", "mvn", "spotless:apply", "-P", "spotless", "-f", pomPath.toString() };
        } else {
            command = new String[] { "mvn", "spotless:apply", "-P", "spotless", "-f", pomPath.toString() };
        }

        try {
            File outputFile = Files.createTempFile(pomPath.getParent(), "spotless", ".log").toFile();
            Process process = new ProcessBuilder(command).redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.to(outputFile))
                .start();
            process.waitFor(300, TimeUnit.SECONDS);

            String errorType = null;
            if (process.exitValue() != 0) {
                errorType = "Process failed with exit code " + process.exitValue();
            }

            if (process.isAlive()) {
                process.destroyForcibly();
                errorType = "Process was killed after 300 seconds timeout";
            }

            if (errorType != null) {
                throw new SpotlessException(
                    String.format("Spotless failed to format code. Error type: %s, log file: '%s', output:\n%s",
                        errorType, outputFile.getAbsolutePath(), Files.readString(outputFile.toPath())));
            }
        } catch (IOException | InterruptedException ex) {
            throw new RuntimeException("Failed to run Spotless on generated code.", ex);
        }
    }

    private static final class SpotlessException extends RuntimeException {
        public SpotlessException(String message) {
            super(message);
        }
    }
}
