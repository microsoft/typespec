// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.github.javaparser.ParseResult;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.Processor;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.customization.Customization;
import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;
import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.api.parallel.Isolated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Isolated
@Execution(ExecutionMode.SAME_THREAD)
public class PostprocessorTests {
    @Test
    public void customizesBeforePartialUpdateWithoutReparsing(@TempDir Path tempDir) throws IOException {
        String fileName = "src/main/java/sample/Example.java";
        Path existingFile = tempDir.resolve(fileName);
        Files.createDirectories(existingFile.getParent());
        Files.writeString(existingFile,
            String.join("\n", "package sample;", "import java.util.Map;", "import java.util.List;",
                "public class Example {", "    public Map<String, List<String>> manual() { return null; }", "}"));
        Path customizationFile = tempDir.resolve("PipelineCustomization.java");
        Files.writeString(customizationFile, String.join("\n", "import com.github.javaparser.ast.CompilationUnit;",
            "import com.microsoft.typespec.http.client.generator.core.customization.Customization;",
            "import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;",
            "import org.slf4j.Logger;", "public class PipelineCustomization extends Customization {",
            "    private CompilationUnit original;",
            "    public void customize(LibraryCustomization library, Logger logger) {",
            "        library.getClass(\"sample\", \"Example\").customizeAst(ast -> {",
            "            if (!ast.getClassByName(\"Example\").orElseThrow().getMethodsByName(\"manual\").isEmpty())",
            "                throw new IllegalStateException(\"Partial update ran before customization\");",
            "            original = ast;", "            ast.addImport(\"java.time.Instant\");",
            "            ast.getClassByName(\"Example\").orElseThrow().addField(\"Instant\", \"timestamp\");",
            "        }).customizeAst(ast -> {",
            "            if (ast != original) throw new IllegalStateException(\"Duplicate parse\");",
            "            ast.getClassByName(\"Example\").orElseThrow().getMethodsByName(\"generated\").get(0)",
            "                .setName(\"customized\");", "        });", "    }", "}"));
        Map<String, Object> settings = Map.of("namespace", "sample", "partial-update", true, "customization-class",
            customizationFile.toString(), "output-folder", tempDir.toString(), "configurationFiles",
            List.of(tempDir.resolve("readme.md").toUri().toString()));
        Map<String, String> output = new HashMap<>();
        NewPlugin plugin = new NewPlugin(null, "test", "test") {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                return (T) settings.get(key);
            }

            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValueWithJsonReader(String key, IOExceptionCheckedFunction<JsonReader, T> converter) {
                return (T) settings.get(key);
            }

            @Override
            public void message(Message message) {
            }

            @Override
            public void writeFile(String name, String content, List<Object> sourceMap) {
                output.put(name, content);
            }

            @Override
            public boolean processInternal() {
                return true;
            }
        };
        AtomicInteger parseCount = new AtomicInteger();
        Supplier<Processor> counter = () -> new Processor() {
            @Override
            public void postProcess(ParseResult<? extends Node> result, ParserConfiguration configuration) {
                if (result.getResult().orElse(null) instanceof CompilationUnit) {
                    parseCount.incrementAndGet();
                }
            }
        };
        NewPlugin previousPlugin = Javagen.getPluginInstance();
        StaticJavaParser.getParserConfiguration().getProcessors().add(counter);
        try {
            JavaSettings.setHost(plugin);
            JavaSettings.clear();
            new Postprocessor(plugin).postProcess(Map.of(fileName,
                String.join("\n", "package sample;", "import java.util.Set;", "import java.util.List;",
                    "import javax.annotation.processing.Generated;", "public class Example {",
                    "    @Generated(\"test\") public void generated() {}", "}")));
            assertEquals(2, parseCount.get());
        } finally {
            StaticJavaParser.getParserConfiguration().getProcessors().remove(counter);
            JavaSettings.setHost(previousPlugin);
            JavaSettings.clear();
        }
        String formatted = output.get(fileName);
        assertTrue(formatted.contains("void customized()"), formatted);
        assertTrue(formatted.contains("Map<String, List<String>> manual()"), formatted);
        assertTrue(formatted.contains("Instant timestamp;"), formatted);
        assertFalse(formatted.contains("import java.util.Set;"), formatted);
        assertEquals(1, formatted.split("import java.util.List;", -1).length - 1);
        assertTrue(formatted.indexOf("import java.time.Instant;") < formatted.indexOf("import java.util.List;"));
        assertTrue(formatted.indexOf("import java.util.List;") < formatted.indexOf("import java.util.Map;"));
    }

    @Test
    public void reusesAstAcrossCustomizationCallbacks() {
        AtomicReference<CompilationUnit> parsed = new AtomicReference<>();
        String fileName = "src/main/java/sample/Example.java";
        Customization customization = new Customization() {
            @Override
            public void customize(LibraryCustomization library, Logger logger) {
                library.getClass("sample", "Example").customizeAst(ast -> {
                    parsed.set(ast);
                    ast.getClassByName("Example").orElseThrow().addField("String", "first");
                }).customizeAst(ast -> {
                    assertSame(parsed.get(), ast);
                    assertTrue(library.getRawEditor().getFileContent(fileName).contains("String first;"));
                    ast.getClassByName("Example").orElseThrow().addField("String", "second");
                });
            }
        };

        Map<String, String> result = customization.run(Map.of(fileName, "package sample; public class Example {}"),
            LoggerFactory.getLogger(PostprocessorTests.class));

        assertTrue(result.get(fileName).contains("String first;"));
        assertTrue(result.get(fileName).contains("String second;"));
    }

    @Test
    public void invalidatesAstAfterTextEdits() {
        String fileName = "Example.java";
        Editor editor = new Editor(Map.of(fileName, "class Example {}"));
        CompilationUnit original = editor.getCompilationUnit(fileName);
        editor.replaceFile(fileName, "class Example { int replaced; }");
        CompilationUnit replaced = editor.getCompilationUnit(fileName);
        assertNotSame(original, replaced);
        assertTrue(replaced.getClassByName("Example").orElseThrow().getFieldByName("replaced").isPresent());

        editor.getContents().put(fileName, "class Example { int direct; }");
        CompilationUnit direct = editor.getCompilationUnit(fileName);
        assertNotSame(replaced, direct);
        assertTrue(direct.getClassByName("Example").orElseThrow().getFieldByName("direct").isPresent());

        editor.removeFile(fileName);
        editor.addFile(fileName, "class Example {}");
        assertNotSame(direct, editor.getCompilationUnit(fileName));
    }

    @Test
    public void discardsFailedAstEdits() {
        String fileName = "src/main/java/sample/Example.java";
        Editor editor = new Editor(Map.of(fileName, "package sample; public class Example {}"));
        Customization customization = new Customization() {
            @Override
            public void customize(LibraryCustomization library, Logger logger) {
                assertThrows(IllegalStateException.class,
                    () -> library.getClass("sample", "Example").customizeAst(ast -> {
                        ast.getClassByName("Example").orElseThrow().addField("String", "failed");
                        throw new IllegalStateException("Customization failed");
                    }));
                library.getClass("sample", "Example").customizeAst(ast -> {
                    assertTrue(ast.getClassByName("Example").orElseThrow().getFieldByName("failed").isEmpty());
                    ast.getClassByName("Example").orElseThrow().addField("String", "successful");
                });
            }
        };

        customization.run(editor, LoggerFactory.getLogger(PostprocessorTests.class));

        assertFalse(editor.getFileContent(fileName).contains("String failed;"));
        assertTrue(editor.getFileContent(fileName).contains("String successful;"));
    }

    @Test
    public void compilesAndRunsCustomizationWithNestedClasses() throws Exception {
        String code = String.join("\n",
            "import com.microsoft.typespec.http.client.generator.core.customization.Customization;",
            "import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;",
            "import org.slf4j.Logger;", "public class InMemoryCustomization extends Customization {",
            "    public void customize(LibraryCustomization library, Logger logger) {",
            "        library.getClass(\"sample\", \"Example\").customizeAst(ast ->",
            "            ast.getClassByName(\"Example\").orElseThrow().addField(\"String\", new Helper().fieldName()));",
            "    }", "    private static class Helper {", "        String fieldName() { return \"customized\"; }",
            "    }", "}");

        Customization customization
            = Postprocessor.loadCustomizationClass("InMemoryCustomization", code).getConstructor().newInstance();
        String fileName = "src/main/java/sample/Example.java";
        Map<String, String> result = customization.run(Map.of(fileName, "package sample; public class Example {}"),
            LoggerFactory.getLogger(PostprocessorTests.class));

        assertTrue(result.get(fileName).contains("String customized;"), result.get(fileName));
    }

    @Test
    public void isolatesCompilationsWithTheSameClassName() throws Exception {
        String template = String.join("\n", "package example;",
            "import com.microsoft.typespec.http.client.generator.core.customization.Customization;",
            "import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;",
            "import org.slf4j.Logger;", "public class ReusedCustomization extends Customization {",
            "    public void customize(LibraryCustomization library, Logger logger) {}",
            "    public static String value() { return \"%s\"; }", "}");

        Class<? extends Customization> first
            = Postprocessor.loadCustomizationClass("example.ReusedCustomization", String.format(template, "first"));
        Class<? extends Customization> second
            = Postprocessor.loadCustomizationClass("example.ReusedCustomization", String.format(template, "second"));

        assertNotSame(first, second);
        assertEquals("first", first.getMethod("value").invoke(null));
        assertEquals("second", second.getMethod("value").invoke(null));
    }

    @Test
    public void reportsCompilationDiagnostics() {
        IllegalStateException exception = assertThrows(IllegalStateException.class,
            () -> Postprocessor.loadCustomizationClass("BrokenCustomization",
                "public class BrokenCustomization { void broken() { missingSymbol(); } }"));

        assertTrue(exception.getMessage().contains("BrokenCustomization.java:1"), exception.getMessage());
        assertTrue(exception.getMessage().contains("missingSymbol"), exception.getMessage());
    }

    @Test
    public void rejectsClassesThatAreNotCustomizations() {
        IllegalStateException exception = assertThrows(IllegalStateException.class,
            () -> Postprocessor.loadCustomizationClass("NotCustomization", "public class NotCustomization {}"));

        assertTrue(exception.getCause() instanceof ClassCastException);
    }
}
