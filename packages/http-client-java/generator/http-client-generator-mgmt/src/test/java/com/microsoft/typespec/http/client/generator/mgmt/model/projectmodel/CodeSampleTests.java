// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class CodeSampleTests {
    @TempDir
    public Path directory;

    @Test
    public void extractsOnlyTheFirstCompleteSampleAndRemovesAssertions() throws IOException {
        Path file = directory.resolve("ExampleTests.java");
        Files.writeString(file,
            String.join("\n", "class ExampleTests {", "    @Test", "    void withoutSample() {", "    }", "    @Test",
                "    void sample() {", "        // @embedmeStart", "        String value = \"café\";",
                "        Assertions.assertNotNull(value);", "        assertEquals(4, value.length());",
                "        value.length();", "        // @embedmeEnd", "        // @embedmeStart",
                "        throw new UnsupportedOperationException();", "        // @embedmeEnd", "    }", "}"),
            StandardCharsets.UTF_8);

        assertEquals("String value = \"café\";\nvalue.length();\n", CodeSample.fromTestFile(file).getCode());
        Files.delete(file);
        assertFalse(Files.exists(file));
    }

    @Test
    public void stopsReadingAfterTheFirstSample() throws IOException {
        Path file = directory.resolve("ExampleTest.java");
        Files
            .writeString(
                file, String.join("\n", "    @Test", "    void sample() {", "        // @embedmeStart",
                    "        sample();", "        // @embedmeEnd", "    }", "") + " ".repeat(32768),
                StandardCharsets.UTF_8);
        // Invalid UTF-8 beyond the reader's buffers must never be decoded after the sample is complete.
        Files.write(file, new byte[] { (byte) 0xc3, (byte) 0x28 }, StandardOpenOption.APPEND);

        assertEquals("sample();\n", CodeSample.fromTestFile(file).getCode());
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "class Empty {}",
            "// @embedmeStart\nsample();\n// @embedmeEnd",
            "    @Test\n    void sample() {\n        // @embedmeStart\n        sample();\n    }" })
    public void ignoresMissingOrIncompleteSamples(String source) throws IOException {
        Path file = directory.resolve("ExampleTest.java");
        Files.writeString(file, source, StandardCharsets.UTF_8);

        assertNull(CodeSample.fromTestFile(file).getCode());
    }
}
