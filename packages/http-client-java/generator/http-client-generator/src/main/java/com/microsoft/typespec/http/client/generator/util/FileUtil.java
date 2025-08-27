// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FileUtil {

    private static final Logger LOGGER = LoggerFactory.getLogger(FileUtil.class);

    private FileUtil() {
    }

    /**
     * Writes the provided content to a file under the specified output directory.
     *
     * <p>The file path is resolved by joining {@code outputDir} and {@code fileName}. Parent
     * directories will be created if they do not exist. The content is written using UTF-8 and
     * any existing file at the same path will be overwritten.</p>
     *
     * @param outputDir output directory under which the file will be created; if it does not
     * exist, parent directories will be created
     * @param fileName name of the file to create (may include subdirectories)
     * @param content content to write to the file
     * @return the {@link Path} that was written
     * @throws IllegalStateException if an I/O error occurs while creating directories or writing the file
     */
    public static Path writeToFile(String outputDir, String fileName, String content) {
        Path outputPath = Paths.get(outputDir, fileName).toAbsolutePath();
        Path parent = outputPath.getParent();

        try {
            // Ensure parent directories exist before writing the file.
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }
            Files.writeString(outputPath, content, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        return outputPath;
    }

    /**
     * Deletes generated Java source files under the specified output directory.
     *
     * <p>Only files that contain a known generated-file marker are deleted. The check reads up to
     * the first 30 lines of each file and looks for generator markers inserted by TypeSpec/AutoRest.
     * If the provided output directory does not exist or is not a directory, the method returns
     * without performing any action. Individual file deletion failures are logged and processing
     * continues for other files.</p>
     *
     * @param outputDir root directory under which generated .java files will be deleted.
     * @throws IllegalStateException if an I/O error occurs while traversing the directory tree.
     */
    public static void deleteGeneratedJavaFiles(String outputDir) {
        deleteGeneratedJavaFiles(outputDir, Collections.emptySet());
    }

    /**
     * Deletes generated Java source files under the specified output directory, except those whose
     * relative paths are included in the supplied set.
     *
     * <p>Relative paths are computed relative to {@code outputDir} and use forward slashes ('/')
     * as separators. Files are considered generated when their content contains one of the
     * recognized generator markers within the first 30 lines. The method will continue on file
     * deletion or access failures and will log warnings for those errors.</p>
     *
     * @param outputDir root directory under which generated .java files will be deleted.
     * @param relativePathOfJavaFilesToKeep set of relative (forward-slash separated) file paths
     * that should be preserved and not deleted.
     * @throws IllegalStateException if an I/O error occurs while traversing the directory tree.
     */
    public static void deleteGeneratedJavaFiles(String outputDir, Set<String> relativePathOfJavaFilesToKeep) {
        Path rootPath = Paths.get(outputDir).resolve("src");
        if (!Files.exists(rootPath) || !Files.isDirectory(rootPath)) {
            return;
        }

        final Set<String> rebasedRelativePathOfJavaFilesToKeep = relativePathOfJavaFilesToKeep.stream()
            .filter(f -> f.startsWith("src/"))
            .map(f -> f.substring(4))
            .collect(Collectors.toSet());

        try {
            Files.walkFileTree(rootPath, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path filePath, BasicFileAttributes attrs) throws IOException {
                    String relativeFilePath = rootPath.relativize(filePath).toString().replace(File.separatorChar, '/');
                    if (!rebasedRelativePathOfJavaFilesToKeep.contains(relativeFilePath)
                        && isGeneratedJavaFile(filePath)) {
                        try {
                            Files.deleteIfExists(filePath);
                        } catch (IOException e) {
                            LOGGER.warn("Failed to delete generated file: {}", filePath.toAbsolutePath().toString(), e);
                        }
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult visitFileFailed(Path file, IOException exc) throws IOException {
                    LOGGER.warn("Failed to access file: {}", file.toAbsolutePath(), exc);
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            throw new IllegalStateException("Failed to delete generated java files under " + outputDir, e);
        }
    }

    private static boolean isGeneratedJavaFile(Path filePath) {
        if (filePath == null
            || !Files.isRegularFile(filePath)
            || !filePath.getFileName().toString().endsWith(".java")) {
            return false;
        }

        try (BufferedReader reader = Files.newBufferedReader(filePath, StandardCharsets.UTF_8)) {
            String line;
            int lines = 0;
            while ((line = reader.readLine()) != null && lines < 30) {
                String trimmedLine = line.trim();
                if (trimmedLine.equals("// Code generated by Microsoft (R) TypeSpec Code Generator.")
                    || trimmedLine.equals("// Code generated by Microsoft (R) AutoRest Code Generator.")) {
                    return true;
                }
                ++lines;
            }
        } catch (IOException e) {
            LOGGER.warn("Unable to read file when checking for generated marker: {}",
                filePath.toAbsolutePath().toString(), e);
        }

        return false;
    }

}
