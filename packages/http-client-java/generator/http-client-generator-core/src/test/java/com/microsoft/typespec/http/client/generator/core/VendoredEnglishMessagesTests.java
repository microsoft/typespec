// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime.Status;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.IProblemFactory;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Messages;
import com.microsoft.typespec.http.client.generator.core.postprocessor.implementation.CodeFormatterUtil;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

public class VendoredEnglishMessagesTests {
    private static final String SYNTAX_ERROR = "Syntax error on token \"int\", Identifier expected";

    @Test
    public void runtimeDoesNotLoadTranslatedMessageBundles() throws Exception {
        Path classes = Path.of(CodeFormatterUtil.class.getProtectionDomain().getCodeSource().getLocation().toURI());
        Path vendor = classes.resolve("com/microsoft/typespec/http/client/generator/core/implementation");
        try (var files = Files.walk(vendor)) {
            for (Path file : files.filter(Files::isRegularFile).toList()) {
                assertFalse(file.toString().endsWith(".properties"), file::toString);
                if (file.toString().endsWith(".class")) {
                    String bytecode = new String(Files.readAllBytes(file), StandardCharsets.ISO_8859_1);
                    assertFalse(bytecode.contains("java/util/ResourceBundle"), file::toString);
                    assertFalse(bytecode.contains("java/util/PropertyResourceBundle"), file::toString);
                }
            }
        }
        assertThrows(NoSuchMethodException.class, () -> IProblemFactory.class.getDeclaredConstructor(Locale.class));
    }

    @Test
    public void englishMessagesRetainArgumentAndQuoteFormatting() {
        assertEquals(SYNTAX_ERROR,
            new IProblemFactory().getLocalizedMessage(204, new String[] { "int", "Identifier" }));
        assertEquals("Hello {0} world", Messages.bind("Hello '{0}' {1}", new Object[] { "ignored", "world" }));
        assertEquals("Value 'quoted'", Messages.bind("Value ''{0}''", "quoted"));
    }

    @Test
    public void statusMessagesInterpolateTheException() {
        assertEquals("Status ERROR: org.eclipse.jdt.core code=4 failed java.lang.IllegalStateException: boom",
            new Status("failed", new IllegalStateException("boom")).toString());
        assertEquals("Status ERROR: org.eclipse.jdt.core code=4 IllegalStateException java.lang.IllegalStateException",
            new Status(null, new IllegalStateException()).toString());
    }

    @Test
    public void englishMessagesDoNotDependOnTheHostLocale() throws Exception {
        String classpath = System.getProperty("surefire.test.class.path", System.getProperty("java.class.path"));
        String executable = System.getProperty("os.name").startsWith("Windows") ? "java.exe" : "java";
        Process process = new ProcessBuilder(Path.of(System.getProperty("java.home"), "bin", executable).toString(),
            "-Xms16m", "-Xmx64m", "-XX:+UseSerialGC", "-Duser.language=fr", "-Duser.country=FR", "-cp", classpath,
            LocaleProbe.class.getName()).redirectErrorStream(true).start();
        try {
            assertTrue(process.waitFor(30, TimeUnit.SECONDS), "English message probe timed out");
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            assertEquals(0, process.exitValue(), output);
            assertEquals(List.of(SYNTAX_ERROR, "1,234"), output.lines().toList());
        } finally {
            process.destroyForcibly();
        }
    }

    public static final class LocaleProbe {
        public static void main(String[] args) {
            System.out.println(new IProblemFactory().getLocalizedMessage(204, new String[] { "int", "Identifier" }));
            System.out.println(Messages.bind("{0,number,integer}", 1234));
        }
    }
}
