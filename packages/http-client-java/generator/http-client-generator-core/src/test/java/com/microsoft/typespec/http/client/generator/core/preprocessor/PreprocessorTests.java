// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.preprocessor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.junit.jupiter.api.parallel.Resources;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@ResourceLock(Resources.SYSTEM_PROPERTIES)
public class PreprocessorTests {
    private static final String DUMP_PROPERTY = "codegen.java.dump-code-model";
    private static final String TEMP_PROPERTY = "codegen.java.temp.directory";
    private String originalDumpProperty;
    private String originalTempProperty;

    @TempDir
    public Path tempDirectory;

    @BeforeEach
    public void configureDiagnostics() {
        originalDumpProperty = System.getProperty(DUMP_PROPERTY);
        originalTempProperty = System.getProperty(TEMP_PROPERTY);
        System.setProperty(DUMP_PROPERTY, "false");
        System.setProperty(TEMP_PROPERTY, tempDirectory.toString());
    }

    @AfterEach
    public void restoreProperties() {
        restoreProperty(DUMP_PROPERTY, originalDumpProperty);
        restoreProperty(TEMP_PROPERTY, originalTempProperty);
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void onlyWritesSnapshotsWhenEnabled(boolean enabled) throws IOException {
        System.setProperty(DUMP_PROPERTY, Boolean.toString(enabled));
        Preprocessor preprocessor = new Preprocessor(new TestHost(false), null, "test", "test");

        CodeModel result = preprocessor.processCodeModel();

        assertNotNull(result.getSchemas());
        assertEquals("Example", result.getLanguage().getJava().getName());
        List<Path> directories;
        try (Stream<Path> paths = Files.list(tempDirectory)) {
            directories = paths.collect(Collectors.toList());
        }
        assertEquals(enabled ? 1 : 0, directories.size());
        if (enabled) {
            Path directory = directories.get(0);
            assertEquals(TestHost.INPUT, Files.readString(directory.resolve("code-model.yaml")));
            assertTrue(Files.readString(directory.resolve("code-model-processed-no-tags.yaml")).contains("Example"));
        }
    }

    @Test
    public void pluginDebuggingAlsoEnablesSnapshots() throws IOException {
        Preprocessor preprocessor = new Preprocessor(new TestHost(true), null, "test", "test");

        preprocessor.processCodeModel();

        try (Stream<Path> paths = Files.list(tempDirectory)) {
            assertEquals(1, paths.count());
        }
    }

    @Test
    public void disabledDiagnosticsDoNotAccessTheConfiguredTempPath() throws IOException {
        Path file = tempDirectory.resolve("not-a-directory");
        Files.writeString(file, "unchanged");
        System.setProperty(TEMP_PROPERTY, file.toString());
        Preprocessor preprocessor = new Preprocessor(new TestHost(false), null, "test", "test");

        preprocessor.processCodeModel();

        assertEquals("unchanged", Files.readString(file));
    }

    private static void restoreProperty(String key, String value) {
        if (value == null) {
            System.clearProperty(key);
        } else {
            System.setProperty(key, value);
        }
    }

    private static final class TestHost extends NewPlugin {
        private static final String INPUT
            = "info:\n  title: Example\n  description: Example service\nlanguage:\n  default:\n    name: Example\nschemas: {}\n";
        private final boolean debug;

        private TestHost(boolean debug) {
            super(null, "test", "test");
            this.debug = debug;
        }

        @Override
        public boolean getBooleanValue(String key, boolean defaultValue) {
            return "debug".equals(key) && debug;
        }

        @Override
        public List<String> listInputs() {
            return List.of("code-model-no-tags.yaml");
        }

        @Override
        public String readFile(String fileName) {
            return INPUT;
        }

        @Override
        public void message(Message message) {
        }

        @Override
        public boolean processInternal() {
            throw new UnsupportedOperationException();
        }
    }
}
