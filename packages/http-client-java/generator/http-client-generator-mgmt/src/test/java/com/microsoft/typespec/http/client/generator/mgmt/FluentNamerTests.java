// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schemas;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@Isolated("Management preprocessing resets the shared Java settings")
public class FluentNamerTests {
    private String originalDumpProperty;
    private String originalTempProperty;

    @TempDir
    public Path tempDirectory;

    @BeforeEach
    public void configureDiagnostics() {
        originalDumpProperty = System.getProperty("codegen.java.dump-code-model");
        originalTempProperty = System.getProperty("codegen.java.temp.directory");
        System.setProperty("codegen.java.temp.directory", tempDirectory.toString());
    }

    @AfterEach
    public void restoreProperties() {
        restoreProperty("codegen.java.dump-code-model", originalDumpProperty);
        restoreProperty("codegen.java.temp.directory", originalTempProperty);
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void inMemoryModelsAreOnlyDumpedWhenEnabled(boolean enabled) throws IOException {
        System.setProperty("codegen.java.dump-code-model", Boolean.toString(enabled));
        CodeModel model = new CodeModel();
        model.setSchemas(new Schemas());
        Language language = new Language();
        language.setName("Example");
        Languages languages = new Languages();
        languages.setJava(language);
        model.setLanguage(languages);
        TestNamer namer = new TestNamer(model);

        assertSame(model, namer.processCodeModel());
        List<Path> directories;
        try (Stream<Path> paths = Files.list(tempDirectory)) {
            directories = paths.collect(Collectors.toList());
        }
        assertEquals(enabled ? 1 : 0, directories.size());
        if (enabled) {
            assertTrue(Files.readString(directories.get(0).resolve("code-model-fluentnamer-no-tags.yaml"))
                .contains("Example"));
        }
    }

    private static void restoreProperty(String key, String value) {
        if (value == null) {
            System.clearProperty(key);
        } else {
            System.setProperty(key, value);
        }
    }

    private static final class TestNamer extends FluentNamer {
        private final CodeModel model;

        private TestNamer(CodeModel model) {
            super(new TestHost(), null, "test", "test");
            this.model = model;
        }

        @Override
        protected CodeModel getCodeModelAndWriteToTargetFolder(Path directory) {
            return model;
        }

        @Override
        public CodeModel transform(CodeModel model) {
            return model;
        }
    }

    private static final class TestHost extends NewPlugin {
        private TestHost() {
            super(null, "test", "test");
        }

        @Override
        public boolean getBooleanValue(String key, boolean defaultValue) {
            return false;
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
