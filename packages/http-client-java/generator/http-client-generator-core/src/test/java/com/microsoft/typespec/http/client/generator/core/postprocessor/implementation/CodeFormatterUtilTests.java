// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.github.javaparser.Processor;
import com.github.javaparser.StaticJavaParser;
import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

public class CodeFormatterUtilTests {
    @ParameterizedTest
    @CsvSource({ "0,20,,1", "17,20,,1", "64,20,,2", "143,20,,4", "143,1,,1", "143,20,1,1", "143,20,100,4", "2,20,4,2" })
    public void boundsFormatterParallelism(int files, int processors, String configured, int expected) {
        assertEquals(expected, CodeFormatterUtil.resolveParallelism(files, processors, configured));
    }

    @ParameterizedTest
    @ValueSource(strings = { "0", "-1", "invalid" })
    public void rejectsInvalidParallelism(String configured) {
        assertThrows(IllegalArgumentException.class, () -> CodeFormatterUtil.resolveParallelism(64, 20, configured));
    }

    @Test
    public void parallelFormattingMatchesSequentialFormatting() {
        Map<String, String> files = new LinkedHashMap<>();
        files.put("module-info.java", "module sample { exports sample; }");
        files.put("package-info.java", "/** Sample package. */ package sample;");
        for (int index = 0; index < 64; index++) {
            files.put("Example" + index + ".java",
                "package sample;\nimport java.util.Set;\nimport java.util.List;\n" + "public class Example" + index
                    + " { List<String> values; int identity() { return " + index + "; } }");
        }
        List<Map.Entry<String, String>> sequential
            = CodeFormatterUtil.formatCodeInternal(new Editor(files), null, 1).collect(Collectors.toList());

        for (int iteration = 0; iteration < 3; iteration++) {
            List<Map.Entry<String, String>> parallel
                = CodeFormatterUtil.formatCodeInternal(new Editor(files), null, 4).collect(Collectors.toList());
            assertEquals(sequential, parallel);
        }
        assertEquals(List.copyOf(files.keySet()),
            sequential.stream().map(Map.Entry::getKey).collect(Collectors.toList()));
    }

    @Test
    public void parallelFormattingReportsAllErrorsInOrder() {
        Map<String, String> files = new LinkedHashMap<>();
        files.put("First.java", "class First { void broken( }");
        files.put("Valid.java", "class Valid {}");
        files.put("Second.java", "class Second { void broken( }");
        IllegalStateException sequential = assertThrows(IllegalStateException.class,
            () -> CodeFormatterUtil.formatCodeInternal(new Editor(files), null, 1).collect(Collectors.toList()));
        IllegalStateException parallel = assertThrows(IllegalStateException.class,
            () -> CodeFormatterUtil.formatCodeInternal(new Editor(files), null, 4).collect(Collectors.toList()));

        assertEquals(sequential.getMessage(), parallel.getMessage());
        assertTrue(parallel.getMessage().indexOf("First.java") < parallel.getMessage().indexOf("Second.java"));
    }

    @Test
    public void preservesInterruption() {
        Thread.currentThread().interrupt();
        try {
            assertThrows(IllegalStateException.class, () -> CodeFormatterUtil
                .formatCodeInternal(new Editor(Map.of("Example.java", "class Example {}")), null, 4));
            assertTrue(Thread.currentThread().isInterrupted());
        } finally {
            Thread.interrupted();
        }
        assertEquals(1, CodeFormatterUtil.formatCode(Map.of("Example.java", "class Example {}")).size());
    }

    @Test
    public void skipsAstParsingForUntouchedFilesIncludingModules() {
        AtomicInteger parseCount = new AtomicInteger();
        Supplier<Processor> counter = () -> {
            parseCount.incrementAndGet();
            return new Processor();
        };
        StaticJavaParser.getParserConfiguration().getProcessors().add(counter);
        try {
            CodeFormatterUtil.formatCode(Map.of("module-info.java", "module sample {}", "nested/module-info.java",
                "class NotAModule {}", "Example.java", "class Example {}"));
            assertEquals(0, parseCount.get());
        } finally {
            StaticJavaParser.getParserConfiguration().getProcessors().remove(counter);
        }
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "import java.util.Set;\nimport java.util.List;\nimport java.util.Map;\n"
                + "class Example { List<String> values; Set<String> names; }",
            "import java.util.Set;\nimport static java.util.Collections.singleton;\nimport java.util.List;\n"
                + "import static java.util.Collections.emptyList;\nimport java.util.Map;\n"
                + "class Example { List<String> values = emptyList(); Set<String> names = singleton(\"name\"); }",
            "import java.util.*;\nimport static java.util.Collections.*;\n"
                + "class Example { List<String> values = emptyList(); }",
            "// Header\npackage sample;\nimport java.util.Set;\n// Import note\nimport java.util.List;\n"
                + "class Example { List<String> values; Set<String> names; }",
            "import java.util.List; // Import note\nclass Example { List<String> values; }",
            "import java.util./* Import note */List;\nclass Example { List<String> values; }",
            "package sample;\r\n\r\nimport java.util.Set;\r\nimport java.util.\r\nList;\r\n"
                + "/** Class documentation. */\r\nclass Example { List<String> values; Set<String> names; }" })
    public void tokenImportOrderingMatchesCachedAst(String source) {
        Editor parsed = new Editor(Map.of("Example.java", source));
        parsed.getCompilationUnit("Example.java");

        assertEquals(CodeFormatterUtil.formatCode(parsed),
            CodeFormatterUtil.formatCode(Map.of("Example.java", source)));
    }

    @Test
    public void collectsSyntaxErrorsAcrossFiles() {
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> CodeFormatterUtil.formatCode(
            Map.of("First.java", "class First { void broken( }", "Second.java", "class Second { void broken( }")));

        assertTrue(exception.getMessage().contains("First.java"), exception.getMessage());
        assertTrue(exception.getMessage().contains("Second.java"), exception.getMessage());
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "import java.util List;",
            "import java.util.;",
            "import static static java.util.List;",
            "import java.util.*.List;",
            "import ;" })
    public void malformedImportsAreNotRewrittenIntoValidCode(String imports) {
        assertThrows(IllegalStateException.class,
            () -> CodeFormatterUtil.formatCode(Map.of("Example.java", imports + "\nclass Example {}")));
    }

    @Test
    public void schemaJavadocFormatting(@TempDir Path tempDir) throws IOException {
        String schema = String.join("\n", " * {", " *     nested (Required): {",
            " *         value: String(<value>/a&b) (Required)", " *     }", " * }");
        String initial = String.join("\n", "/**", " * Response body schema.", " * <!-- @formatter:off -->",
            " * <pre>{@code", schema, " * }</pre>", " * <!-- @formatter:on -->", " */",
            "public class SchemaExample {public void method(){int value=1;}}", "");

        String formatted = CodeFormatterUtil.formatCode(new HashMap<>(Map.of("SchemaExample.java", initial))).get(0);

        assertTrue(formatted.contains(schema), formatted);
        assertTrue(formatted.contains("public void method() {"), formatted);
        assertTrue(formatted.contains("int value = 1;"), formatted);
        assertEquals(formatted,
            CodeFormatterUtil.formatCode(new HashMap<>(Map.of("SchemaExample.java", formatted))).get(0));

        Path source = tempDir.resolve("SchemaExample.java");
        Files.writeString(source, formatted);
        Path documentation = tempDir.resolve("javadoc");
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        assertEquals(0, ToolProvider.getSystemDocumentationTool()
            .run(null, output, output, "-quiet", "-Xdoclint:all", "-d", documentation.toString(), source.toString()),
            output.toString(StandardCharsets.UTF_8));
        String html = Files.readString(documentation.resolve("SchemaExample.html"));
        assertTrue(html.contains("<pre><code>"), html);
        assertTrue(html.contains("&lt;value&gt;/a&amp;b"), html);
    }

    @ParameterizedTest
    @ValueSource(strings = { "module-info.java", "src/main/module-info.java" })
    public void moduleInfoFormatting(String fileName) {
        String initial = String.join("\n", "// Copyright (c) Microsoft Corporation. All rights reserved.",
            "// Licensed under the MIT License.", "// Code generated by Microsoft (R) TypeSpec Code Generator.", "",
            "module com.azure.resourcemanager.avs {", "requires transitive com.azure.core.management;",
            "exports com.azure.resourcemanager.avs;", "exports com.azure.resourcemanager.avs.fluent;",
            "exports com.azure.resourcemanager.avs.fluent.models;", "exports com.azure.resourcemanager.avs.models;",
            "opens com.azure.resourcemanager.avs.fluent.models", "to com.azure.core;",
            "opens com.azure.resourcemanager.avs.models", "to com.azure.core;",
            "opens com.azure.resourcemanager.avs.implementation.models to com.azure.core;", "}");
        String expected = String.join("\n", "// Copyright (c) Microsoft Corporation. All rights reserved.",
            "// Licensed under the MIT License.", "// Code generated by Microsoft (R) TypeSpec Code Generator.", "",
            "module com.azure.resourcemanager.avs {", "    requires transitive com.azure.core.management;", "",
            "    exports com.azure.resourcemanager.avs;", "    exports com.azure.resourcemanager.avs.fluent;",
            "    exports com.azure.resourcemanager.avs.fluent.models;",
            "    exports com.azure.resourcemanager.avs.models;", "",
            "    opens com.azure.resourcemanager.avs.fluent.models to com.azure.core;",
            "    opens com.azure.resourcemanager.avs.models to com.azure.core;",
            "    opens com.azure.resourcemanager.avs.implementation.models to com.azure.core;", "}", "");

        List<String> formattingResult = CodeFormatterUtil.formatCode(new HashMap<>(Map.of(fileName, initial)));

        assertEquals(1, formattingResult.size());
        assertEquals(expected, formattingResult.get(0));
    }
}
