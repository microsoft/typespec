// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;
import org.slf4j.LoggerFactory;

@Isolated("Partial-update tests configure the shared Java settings host")
public class PostprocessorBatchTests {
    @TempDir
    public Path directory;

    @AfterEach
    public void restoreSettings() {
        JavaSettings.clear();
        new MockUnitJavagen();
    }

    @Test
    public void resolvesFallbackDirectoryOnceAndKeepsManualMembersAcrossTheBatch() throws IOException {
        JavaSettings.clear();
        Host host = new Host();
        host.readme = directory.resolve("spec/readme.md").toUri().toString();
        Map<String, String> files = new LinkedHashMap<>();
        for (String name : List.of("First", "Second")) {
            Path source = directory.resolve("src/" + name + ".java");
            Files.createDirectories(source.getParent());
            Files.writeString(source, "class " + name + " { int manual; @Generated int value = 1; }");
            files.put("src/" + name + ".java", "class " + name + " { @Generated int value = 2; }");
        }

        Postprocessor.writeToFiles(files, host, LoggerFactory.getLogger(PostprocessorBatchTests.class));

        assertEquals(1, host.configurationReads);
        assertEquals(2, host.output.size());
        assertTrue(host.output.values().stream().allMatch(content -> content.contains("int manual;")));
        assertTrue(host.output.values().stream().allMatch(content -> content.contains("int value = 2;")));
    }

    @Test
    public void emptyBatchDoesNotResolveAReadme() {
        JavaSettings.clear();
        Host host = new Host();

        Postprocessor.writeToFiles(new LinkedHashMap<>(), host, LoggerFactory.getLogger(PostprocessorBatchTests.class));

        assertEquals(0, host.configurationReads);
        assertTrue(host.output.isEmpty());
    }

    private static final class Host extends MockUnitJavagen {
        private String readme;
        private int configurationReads;
        private final Map<String, String> output = new LinkedHashMap<>();

        @SuppressWarnings("unchecked")
        @Override
        public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
            if ("partial-update".equals(key)) {
                return (T) Boolean.TRUE;
            }
            if ("output-folder".equals(key)) {
                return (T) "relative-output";
            }
            return super.getValue(key, converter);
        }

        @SuppressWarnings("unchecked")
        @Override
        public <T> T getValueWithJsonReader(String key, IOExceptionCheckedFunction<JsonReader, T> converter) {
            if ("configurationFiles".equals(key)) {
                configurationReads++;
                return (T) List.of(readme);
            }
            return getValue(key, null);
        }

        @Override
        public void writeFile(String name, String content, List<Object> sourceMap) {
            output.put(name, content);
        }
    }
}
