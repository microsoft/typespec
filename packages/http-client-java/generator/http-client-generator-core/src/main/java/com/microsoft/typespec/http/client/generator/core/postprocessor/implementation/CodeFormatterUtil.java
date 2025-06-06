// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.slf4j.Logger;

/**
 * Utility class that handles code formatting.
 */
public final class CodeFormatterUtil {

    private static final Pattern SPOTLESS_ERROR_FILE_NAME_PATTERN = Pattern.compile("\\[ERROR].*?in '(.+?\\.java)'");
    private static final Pattern SPOTLESS_ERROR_LINE_NUMBER_PATTERN
        = Pattern.compile("^(\\d+):\\d+: error: (.*)$", Pattern.MULTILINE);
    private static final int SPOTLESS_FILE_CONTENT_RANGE = 3;

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format.
     * @param plugin The plugin to use to write the formatted files.
     */
    public static void formatCode(Map<String, String> files, NewPlugin plugin, Logger logger) {
        try {
            for (Map.Entry<String, String> file : formatCodeInternal(files.entrySet())) {
                plugin.writeFile(file.getKey(), file.getValue(), null);
            }
        } catch (SpotlessException ex) {
            logger.error("Failed to format code", ex);
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

            // only delete the temporary directory if all files were formatted successfully
            Utils.deleteDirectory(tmpDir.toFile());

            return formattedFiles;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
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
                    String.format("Spotless failed to format code. Log file: '%s', Error info: %s", outputFile,
                        getErrorInfo(outputFile.toPath(), pomPath.getParent())));
            }
        } catch (IOException | InterruptedException ex) {
            throw new RuntimeException("Failed to run Spotless on generated code.", ex);
        }
    }

    private static String getErrorInfo(Path outputFile, Path sources) throws IOException {
        List<String> allLines = Files.readAllLines(outputFile);
        for (int i = 0; i < allLines.size() - 1; i++) {
            Matcher fileNameMatcher = SPOTLESS_ERROR_FILE_NAME_PATTERN.matcher(allLines.get(i));
            if (fileNameMatcher.find()) {
                String fileName = fileNameMatcher.group(1);
                Path filePath = sources.resolve(fileName);
                if (!Files.exists(filePath)) {
                    return String.format("file name: '%s', content is not available", fileName);
                }

                String fileContent = Files.readString(filePath);
                Matcher lineNumberMatcher = SPOTLESS_ERROR_LINE_NUMBER_PATTERN.matcher(allLines.get(i + 1));
                if (!lineNumberMatcher.find()) {
                    return String.format("file name: '%s', Full content:\n---\n%s\n---", fileName, fileContent);
                }

                int lineNumber = Integer.parseInt(lineNumberMatcher.group(1));

                String errorContent = fileContent.lines()
                    .skip(Math.max(0, lineNumber - 1 - SPOTLESS_FILE_CONTENT_RANGE))
                    .limit(SPOTLESS_FILE_CONTENT_RANGE * 2 + 1)
                    .collect(Collectors.joining("\n"));

                return String.format("file name: '%s', Content around error:\n---\n%s\n---", fileName, errorContent);
            }
        }

        return null;
    }

    private static final class SpotlessException extends RuntimeException {
        public SpotlessException(String message) {
            super(message);
        }
    }
}
