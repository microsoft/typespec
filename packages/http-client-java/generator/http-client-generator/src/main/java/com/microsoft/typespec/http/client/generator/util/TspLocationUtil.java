// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class TspLocationUtil {

    private static final Logger LOGGER = LoggerFactory.getLogger(TspLocationUtil.class);

    public static class TspLocation {
        private String directory;

        public String getDirectory() {
            return directory;
        }

        public void setDirectory(String directory) {
            this.directory = directory;
        }
    }

    public static String getDirectory(Yaml yaml, Path tspLocationPath) {
        String directory = null;
        try {
            LOGGER.info("tsp-location.yaml file: {}", tspLocationPath.toString());
            String file = Files.readString(tspLocationPath);
            directory = yaml.loadAs(file, TspLocation.class).getDirectory();
        } catch (IOException e) {
            LOGGER.error("Failed to read tsp-location.yaml");
        }
        return directory;
    }
}
