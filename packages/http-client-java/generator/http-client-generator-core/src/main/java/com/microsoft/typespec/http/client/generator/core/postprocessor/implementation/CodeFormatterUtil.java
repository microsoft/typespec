// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.FileUtils;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.slf4j.Logger;

/**
 * Utility class that handles code formatting.
 */
public final class CodeFormatterUtil {

    private static final Logger LOGGER = new PluginLogger(Javagen.getPluginInstance(), CodeFormatterUtil.class);

    private static final Pattern SPOTLESS_ERROR_PATTERN
        = Pattern.compile("^(\\d+):\\d+: error: (.*)$", Pattern.MULTILINE);
    private static final int SPOTLESS_FILE_CONTENT_RANGE = 3;

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format.
     * @param plugin The plugin to use to write the formatted files.
     */
    public static void formatCode(Map<String, String> files, NewPlugin plugin) {
        try {
            for (Map.Entry<String, String> file : formatCodeInternal(files.entrySet())) {
                plugin.writeFile(file.getKey(), file.getValue(), null);
            }
        } catch (SpotlessException ex) {
            // format one file at a time, to give better error diagnostics
            for (Map.Entry<String, String> file : files.entrySet()) {
                try {
                    formatCodeInternal(List.of(file));
                } catch (RuntimeException e) {
                    Matcher matcher = SPOTLESS_ERROR_PATTERN.matcher(e.getMessage());
                    String content = file.getValue();
                    if (matcher.find()) {
                        int lineNumber = Integer.parseInt(matcher.group(1));

                        StringBuilder stringBuilder = new StringBuilder();
                        stringBuilder.append("line: ")
                            .append(lineNumber)
                            .append(", error: ")
                            .append(matcher.group(2))
                            .append("\n");

                        // line number from log start from 1
                        String[] lines = content.split("\n");
                        int lineBegin = Math.max(0, lineNumber - 1 - SPOTLESS_FILE_CONTENT_RANGE);
                        int lineEnd = Math.min(lines.length - 1, lineNumber - 1 + SPOTLESS_FILE_CONTENT_RANGE);
                        for (int i = lineBegin; i <= lineEnd; ++i) {
                            stringBuilder.append(i + 1).append(" ").append(lines[i]).append("\n");
                        }
                        content = stringBuilder.toString();
                    }
                    LOGGER.error("Failed to format file '{}'\n{}", file.getKey(), content);
                }
            }
            throw ex;
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
        return formatCodeInternal(files.entrySet()).stream().map(Map.Entry::getValue).collect(Collectors.toList());
    }

    private static List<Map.Entry<String, String>> formatCodeInternal(Collection<Map.Entry<String, String>> files) {
        Path tmpDir = null;
        try {
            tmpDir = FileUtils.createTempDirectory("spotless" + UUID.randomUUID());

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

            return formattedFiles;
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        } finally {
            if (tmpDir != null) {
                Utils.deleteDirectory(tmpDir.toFile());
            }
        }
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
            outputFile.deleteOnExit();
            Process process = new ProcessBuilder(command).redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.to(outputFile))
                .start();
            process.waitFor(300, TimeUnit.SECONDS);

            if (process.isAlive() || process.exitValue() != 0) {
                process.destroyForcibly();
                throw new SpotlessException(
                    "Spotless failed to complete within 300 seconds or failed with an error code. "
                        + Files.readString(outputFile.toPath()));
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
