// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.payload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class FileUtils {

    private FileUtils() {
    }

    public static Path getJpgFile() {
        return Paths.get("node_modules/@azure-tools/cadl-ranch-specs/assets/image.jpg");
    }

    public static Path getPngFile() {
        return Paths.get("node_modules/@azure-tools/cadl-ranch-specs/assets/image.png");
    }

    public static byte[] getJpgBytes() {
        try {
            return Files.readAllBytes(getJpgFile());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static byte[] getPngBytes() {
        try {
            return Files.readAllBytes(getPngFile());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
