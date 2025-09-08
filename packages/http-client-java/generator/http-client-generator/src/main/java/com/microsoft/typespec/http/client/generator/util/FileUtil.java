// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FileUtil {

    private static final Logger LOGGER = LoggerFactory.getLogger(FileUtil.class);

    private FileUtil() {
    }

    /**
     * Writes the provided content to a file under the specified output directory.
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
     * Filters and returns a sorted list of Java source file paths under 'src/main/'.
     *
     * @param javaFiles stream of file paths to filter
     * @return sorted list of Java source file paths
     */
    public static List<String> filterForJavaSourceFiles(Stream<String> javaFiles) {
        return javaFiles.filter(filename -> filename.startsWith("src/main/") && filename.endsWith(".java"))
            .sorted()
            .collect(Collectors.toList());
    }

    /**
     * Deletes the specified files from the given directory if they exist.
     *
     * @param directory the directory containing the files
     * @param filesToDelete collection of file names to delete
     */
    public static void deleteFiles(String directory, Collection<String> filesToDelete) {
        filesToDelete.forEach(filename -> {
            Path filePath = Paths.get(directory, filename).toAbsolutePath();
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                LOGGER.warn("Failed to delete file: {}", filePath, e);
            }
        });
    }

    /**
     * Deletes all files in the specified directory.
     *
     * @param directory the directory whose files will be deleted
     */
    public static void deleteFilesInDirectory(Path directory) {
        Path path = directory.toAbsolutePath();
        if (Files.isDirectory(path)) {
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(path)) {
                stream.forEach(filePath -> {
                    try {
                        Files.deleteIfExists(filePath);
                    } catch (IOException e) {
                        LOGGER.warn("Failed to delete file: {}", filePath, e);
                    }
                });
            } catch (IOException e) {
                LOGGER.warn("Failed to list files in path: {}", path, e);
            }
        }
    }

    /**
     * Options for configuring the deletion of generated Java files.
     * This class provides configuration options to control which directories and files
     * are included when deleting generated Java source files.
     */
    public static class DeleteGeneratedJavaFilesOptions {
        private Set<String> relativePathOfJavaFilesToKeep = Collections.emptySet();
        private boolean includeSamplesDir = false;
        private boolean includeTestDir = false;

        public Set<String> getRelativePathOfJavaFilesToKeep() {
            return relativePathOfJavaFilesToKeep;
        }

        public DeleteGeneratedJavaFilesOptions
            setRelativePathOfJavaFilesToKeep(Set<String> relativePathOfJavaFilesToKeep) {
            this.relativePathOfJavaFilesToKeep = relativePathOfJavaFilesToKeep;
            return this;
        }

        public boolean isIncludeSamplesDir() {
            return includeSamplesDir;
        }

        public DeleteGeneratedJavaFilesOptions setIncludeSamplesDir(boolean includeSamplesDir) {
            this.includeSamplesDir = includeSamplesDir;
            return this;
        }

        public boolean isIncludeTestDir() {
            return includeTestDir;
        }

        public DeleteGeneratedJavaFilesOptions setIncludeTestDir(boolean includeTestDir) {
            this.includeTestDir = includeTestDir;
            return this;
        }
    }

    /**
     * Deletes generated Java source files under the specified output directory, except those whose
     * relative paths are included in the supplied set.
     *
     * @param outputDir root directory under which generated .java files will be deleted; the method
     * looks for a 'src' subdirectory beneath this directory and operates under it.
     * @param deleteGeneratedJavaFilesOptions configuration options that control which directories to include
     * (samples and test directories) and which specific Java files to preserve during the deletion process.
     * @throws IllegalStateException if an I/O error occurs while traversing the directory tree.
     */
    public static void deleteFiles(String outputDir, DeleteGeneratedJavaFilesOptions deleteGeneratedJavaFilesOptions) {
        Set<String> relativePathOfJavaFilesToKeep = deleteGeneratedJavaFilesOptions.getRelativePathOfJavaFilesToKeep();
        if (deleteGeneratedJavaFilesOptions.isIncludeSamplesDir()
            && deleteGeneratedJavaFilesOptions.isIncludeTestDir()) {
            deleteFiles(outputDir, "src/", relativePathOfJavaFilesToKeep);
        } else {
            deleteFiles(outputDir, "src/main/", relativePathOfJavaFilesToKeep);
            if (deleteGeneratedJavaFilesOptions.isIncludeSamplesDir()) {
                // delete generated files in samples dir, if emitter need to generate samples
                deleteFiles(outputDir, "src/samples/", relativePathOfJavaFilesToKeep);
            } else if (deleteGeneratedJavaFilesOptions.isIncludeTestDir()) {
                // delete generated files in test dir, if emitter need to generate test
                deleteFiles(outputDir, "src/test/", relativePathOfJavaFilesToKeep);
            }
        }
    }

    private static void deleteFiles(String outputDir, String subDir, Set<String> relativePathOfJavaFilesToKeep) {
        // scope rootPath and relativePathOfJavaFilesToKeep to subDir
        Path rootPath = Paths.get(outputDir).resolve(subDir);
        if (!Files.exists(rootPath) || !Files.isDirectory(rootPath)) {
            return;
        }
        final Set<String> rebasedRelativePathOfJavaFilesToKeep = relativePathOfJavaFilesToKeep.stream()
            .filter(f -> f.startsWith(subDir))
            .map(f -> f.substring(subDir.length()))
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
                            LOGGER.warn("Failed to delete generated file: {}", filePath.toAbsolutePath(), e);
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
            final String typeSpecMarker = "// Code generated by Microsoft (R) TypeSpec Code Generator.";
            final String autoRestMarker = "// Code generated by Microsoft (R) AutoRest Code Generator.";

            String line;
            while ((line = reader.readLine()) != null) {
                String trimmedLine = line.trim();
                if (trimmedLine.equals(typeSpecMarker) || trimmedLine.equals(autoRestMarker)) {
                    return true;
                }
            }
        } catch (IOException e) {
            LOGGER.warn("Unable to read file when checking for generated marker: {}", filePath.toAbsolutePath(), e);
        }

        return false;
    }

}
