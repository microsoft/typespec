// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.typespec.http.client.generator.core.extension.base.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Utility class for file operations.
 */
public final class FileUtils {
    private FileUtils() {
    }

    /**
     * Creates a temporary directory.
     * <p>
     * If the environment setting {@code codegen.java.temp.directory} is set, the directory will be created under the
     * specified path. Otherwise, the directory will be created under the system default temporary directory.
     * <p>
     * {@link System#getProperty(String)} is checked before {@link System#getenv(String)}.
     * <p>
     * If {@code codegen.java.temp.directory} is set to a non-existent path, the directory will be created under the
     * system default temporary directory.
     *
     * @param prefix The prefix string to be used in generating the directory's name; may be {@code null}.
     * @return The path to the newly created directory.
     * @throws IOException If an I/O error occurs.
     */
    public static Path createTempDirectory(String prefix) throws IOException {
        String tempDirectory = System.getProperty("codegen.java.temp.directory");
        if (tempDirectory == null) {
            tempDirectory = System.getenv("codegen.java.temp.directory");
        }

        if (tempDirectory != null) {
            Path tempDirectoryPath = Paths.get(tempDirectory);
            if (Files.exists(tempDirectoryPath)) {
                return Files.createTempDirectory(tempDirectoryPath, prefix);
            }
        }

        return Files.createTempDirectory(prefix);
    }
}
