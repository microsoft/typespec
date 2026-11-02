// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.customization.Customization;
import org.junit.jupiter.api.Test;

public class PostprocessorTests {
    @Test
    public void loadsJavaCustomization() throws ReflectiveOperationException {
        String source
            = String.join("\n", "import com.microsoft.typespec.http.client.generator.core.customization.Customization;",
                "import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;",
                "import org.slf4j.Logger;", "public class TestCustomization extends Customization {", "    @Override",
                "    public void customize(LibraryCustomization customization, Logger logger) {",
                "        logger.info(\"compiled\");", "    }", "}");

        Class<? extends Customization> customizationClass
            = Postprocessor.loadCustomizationClass("TestCustomization", source);

        assertEquals("TestCustomization", customizationClass.getSimpleName());
        assertInstanceOf(Customization.class, customizationClass.getConstructor().newInstance());
    }

    @Test
    public void reportsJavaCompilationErrors() {
        RuntimeException error = assertThrows(RuntimeException.class, () -> Postprocessor
            .loadCustomizationClass("BrokenCustomization", "public class BrokenCustomization extends MissingType {}"));

        assertTrue(error.getMessage().contains("MissingType"));
    }
}
