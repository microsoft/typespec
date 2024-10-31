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
import java.util.stream.Collectors;

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
    public static void formatCode(Map<String, String> files, NewPlugin plugin) {
        for (Map.Entry<String, String> file : formatCodeInternal(files.entrySet())) {
            plugin.writeFile(file.getKey(), file.getValue(), null);
        }
    }

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format. The entry is filename and content.
     * @return the files after format.
     * @throws Exception If code formatting fails.
     */
    public static List<String> formatCode(Collection<Map.Entry<String, String>> files) throws Exception {
        return formatCodeInternal(files).stream().map(Map.Entry::getValue).collect(Collectors.toList());
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
                throw new RuntimeException(
                    "Spotless failed to complete within 300 seconds or failed with an error code. "
                        + Files.readString(outputFile.toPath()));
            }
        } catch (IOException | InterruptedException ex) {
            throw new RuntimeException("Failed to run Spotless on generated code.", ex);
        }
    }
}
