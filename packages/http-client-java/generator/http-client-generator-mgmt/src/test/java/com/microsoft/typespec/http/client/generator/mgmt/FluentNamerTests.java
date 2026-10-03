// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class FluentNamerTests {
    @ParameterizedTest
    @ValueSource(strings = { "none", "debug", "debugger" })
    public void writesDebugYamlOnlyWhenEnabled(String debugOption) throws Exception {
        AtomicReference<Path> debugDirectory = new AtomicReference<>();
        CodeModel codeModel = new CodeModel();
        FluentNamer namer = new FluentNamer(new MockJavagen(null), null, "test", "test") {
            @Override
            public boolean getBooleanValue(String key, boolean defaultValue) {
                return debugOption.equals(key) || defaultValue;
            }

            @Override
            protected CodeModel getCodeModelAndWriteToTargetFolder(Path codeModelFolder) {
                debugDirectory.set(codeModelFolder);
                return codeModel;
            }

            @Override
            public CodeModel transform(CodeModel input) {
                return input;
            }
        };

        try {
            assertSame(codeModel, namer.processCodeModel());
            if ("none".equals(debugOption)) {
                assertNull(debugDirectory.get());
            } else {
                assertTrue(Files.size(debugDirectory.get().resolve("code-model-fluentnamer-no-tags.yaml")) > 0);
            }
        } finally {
            if (debugDirectory.get() != null) {
                Files.deleteIfExists(debugDirectory.get().resolve("code-model-fluentnamer-no-tags.yaml"));
                Files.delete(debugDirectory.get());
            }
        }
    }
}
