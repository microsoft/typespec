// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.models.binarydata.BinaryData;
import java.io.InputStream;
import java.lang.reflect.Constructor;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

class OptionalInstanceUtilityTemplateTests {
    private static final String MULTIPART = "MultipartFormDataHelper";

    @TempDir
    Path classes;

    static Stream<Arguments> multipartMethods() {
        return Stream.of(Arguments.of("getRequestBody", Set.of("getRequestBody")),
            Arguments.of("serializeTextField", Set.of("serializeTextField", "escapeName", "appendBytes")),
            Arguments.of("serializeJsonField", Set.of("serializeJsonField", "escapeName", "appendBytes")),
            Arguments.of("serializeFileField",
                Set.of("serializeFileField", "writeFileField", "escapeName", "appendBytes")),
            Arguments.of("serializeFileFields",
                Set.of("serializeFileFields", "writeFileField", "escapeName", "appendBytes")),
            Arguments.of("end", Set.of("end", "appendBytes")),
            Arguments.of("writeFileField", Set.of("writeFileField", "escapeName", "appendBytes")),
            Arguments.of("appendBytes", Set.of("appendBytes")), Arguments.of("escapeName", Set.of("escapeName")));
    }

    @ParameterizedTest
    @MethodSource("multipartMethods")
    void everyMultipartMethodIsIndependentlyOptional(String name, Set<String> expected) throws Exception {
        String source = render("GenericMultipartFormDataHelper", MULTIPART, Set.of(name));
        Assertions.assertEquals(expected, methods(source));
        Assertions.assertEquals(2,
            StaticJavaParser.parse(source).getClassByName(MULTIPART).orElseThrow().getConstructors().size());
        if (!expected.contains("serializeFileFields")) {
            Assertions.assertFalse(source.contains("import java.util.List;"), source);
        }
        if (!expected.contains("writeFileField")) {
            Assertions.assertFalse(source.contains("APPLICATION_OCTET_STREAM"), source);
        }
        compile("example." + MULTIPART, source);
    }

    @Test
    void testsCoverEveryMultipartMethod() throws Exception {
        try (InputStream resource = getClass().getResourceAsStream("/GenericMultipartFormDataHelper.java")) {
            Set<String> catalog = StaticJavaParser.parse(resource)
                .findAll(MethodDeclaration.class)
                .stream()
                .map(MethodDeclaration::getNameAsString)
                .collect(Collectors.toSet());
            Assertions.assertEquals(catalog,
                multipartMethods().map(arguments -> (String) arguments.get()[0]).collect(Collectors.toSet()));
        }
    }

    @Test
    void fluentCallsUnionAcrossGeneratedClientsAndStopAtNonHelperReturnTypes() {
        OptionalUtilityTemplate template = multipartTemplate();
        JavaFile text = caller("class Text { void call() { new MultipartFormDataHelper(null)"
            + ".serializeTextField(\"text\", \"value\").end().getRequestBody().toBytes(); } }");
        JavaFile files = caller("class Files { void call() { new example.MultipartFormDataHelper(null)"
            + ".serializeFileFields(\"files\", null, null, null).end().getRequestBody(); } }");
        Set<String> required = template.getRequiredMembers(List.of(text, files));
        Assertions.assertEquals(Set.of(MULTIPART, "serializeTextField", "serializeFileFields", "end", "getRequestBody"),
            required);
        String output = render("GenericMultipartFormDataHelper", MULTIPART, required);
        Assertions.assertEquals(Set.of("serializeTextField", "serializeFileFields", "end", "getRequestBody",
            "writeFileField", "escapeName", "appendBytes"), methods(output));
        Assertions.assertFalse(output.contains("serializeJsonField"), output);
        Assertions.assertFalse(output.contains("serializeFileField("), output);
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "MultipartFormDataHelper helper = new MultipartFormDataHelper(null); helper.serializeTextField(\"name\", \"value\");",
            "var helper = new MultipartFormDataHelper(null); helper.serializeTextField(\"name\", \"value\");",
            "var helper = new MultipartFormDataHelper(null).serializeTextField(\"name\", \"value\"); helper.end();",
            "MultipartFormDataHelper helper = new MultipartFormDataHelper(null); (helper).serializeTextField(\"name\", \"value\");",
            "Object helper = new MultipartFormDataHelper(null); ((MultipartFormDataHelper) helper).serializeTextField(\"name\", \"value\");" })
    void typedInferredAndCastReceiversSelectInstanceMethods(String body) {
        Set<String> selected
            = multipartTemplate().getRequiredMembers(List.of(caller("class Caller { void call() { " + body + " } }")));
        Assertions.assertTrue(selected.containsAll(Set.of(MULTIPART, "serializeTextField")), selected.toString());
        Assertions.assertFalse(selected.contains("serializeJsonField"), selected.toString());
    }

    @Test
    void receiverDeclarationsRespectScopesAndShadowing() {
        JavaFile source = caller("class Caller { MultipartFormDataHelper helper;"
            + " void text() { helper.serializeTextField(\"name\", \"value\"); }"
            + " void field(Other helper) { this.helper.end(); helper.serializeJsonField(\"json\", null); }"
            + " void other(Other helper) { helper.serializeFileField(null, null, null, null); }"
            + " void local() { { Other helper = null; helper.serializeFileFields(null, null, null, null); }"
            + " helper.getRequestBody(); } }");
        Assertions.assertEquals(Set.of("serializeTextField", "end", "getRequestBody"),
            multipartTemplate().getRequiredMembers(List.of(source)));
    }

    @Test
    void parametersAndLoopReceiversAreRecognized() {
        JavaFile source = caller(
            "class Caller { void call(MultipartFormDataHelper parameter, java.util.List<MultipartFormDataHelper> helpers) {"
                + " parameter.serializeTextField(\"text\", \"value\");"
                + " for (MultipartFormDataHelper helper : helpers) { helper.end(); }"
                + " for (MultipartFormDataHelper helper = parameter; helper != null;) { helper.getRequestBody(); break; }"
                + " java.util.function.Consumer<MultipartFormDataHelper> action = (MultipartFormDataHelper helper) -> helper.serializeJsonField(\"json\", null);"
                + " } }");
        Assertions.assertEquals(Set.of("serializeTextField", "end", "getRequestBody", "serializeJsonField"),
            multipartTemplate().getRequiredMembers(List.of(source)));
    }

    @Test
    void constructorAndBoundMethodReferencesAreOptionalRoots() {
        JavaFile source = caller("class Caller { void call(MultipartFormDataHelper helper) {"
            + " java.util.function.Function<Object, MultipartFormDataHelper> factory = MultipartFormDataHelper::new;"
            + " java.util.function.Supplier<MultipartFormDataHelper> end = helper::end;"
            + " java.util.function.Function<MultipartFormDataHelper, Object> body = MultipartFormDataHelper::getRequestBody;"
            + " } }");
        Assertions.assertEquals(Set.of(MULTIPART, "end", "getRequestBody"),
            multipartTemplate().getRequiredMembers(List.of(source)));
    }

    @Test
    void constructorOnlyUsageDoesNotRetainUnusedMethods() throws Exception {
        Set<String> required = multipartTemplate()
            .getRequiredMembers(List.of(caller("class Caller { Object value = new MultipartFormDataHelper(null); }")));
        Assertions.assertEquals(Set.of(MULTIPART), required);
        String source = render("GenericMultipartFormDataHelper", MULTIPART, required);
        Assertions.assertTrue(methods(source).isEmpty(), source);
        compile("example." + MULTIPART, source);
    }

    @Test
    void unusedImportsAndTextAloneDoNotEmitTheInstanceUtility() {
        JavaFile source = caller("import example.MultipartFormDataHelper; class Caller {"
            + " String value = \"new MultipartFormDataHelper(null).end()\"; } ");
        Assertions.assertTrue(multipartTemplate().getRequiredMembers(List.of(source)).isEmpty());
        JavaFile output = new JavaFile(MULTIPART + ".java");
        multipartTemplate().write(Set.of(), output);
        Assertions.assertTrue(output.getContents().toString().isEmpty());
    }

    @Test
    void typeOnlyReferencesRetainTheClassWithoutUnusedMethods() throws Exception {
        JavaFile source
            = caller("class Caller { MultipartFormDataHelper unused; Class<?> type = MultipartFormDataHelper.class; }");
        Set<String> required = multipartTemplate().getRequiredMembers(List.of(source));
        Assertions.assertEquals(Set.of(MULTIPART), required);
        String output = render("GenericMultipartFormDataHelper", MULTIPART, required);
        Assertions.assertTrue(methods(output).isEmpty(), output);
        compile("example." + MULTIPART, output);
    }

    @Test
    void unrelatedThisQualifiedFluentCallsDoNotSelectHelperMethods() {
        JavaFile source = caller("import example.MultipartFormDataHelper; class Caller {"
            + " Caller end() { return this; } void serializeJsonField(String name, Object value) {}"
            + " void call() { this.end().serializeJsonField(\"json\", null); } }");
        Assertions.assertTrue(multipartTemplate().getRequiredMembers(List.of(source)).isEmpty());
    }

    @Test
    void constructorsInitializersAndThisReferencesRetainWorkingDependencies() throws Exception {
        String source = render("OptionalInstanceUtility", "OptionalInstanceUtility", Set.of("getValue"));
        Assertions.assertEquals(Set.of("getValue", "normalize", "format", "prefix", "initialize"), methods(source));
        Assertions.assertFalse(source.contains("Locale"), source);
        compile("example.OptionalInstanceUtility", source);
        try (URLClassLoader loader = loader()) {
            Class<?> type = loader.loadClass("example.OptionalInstanceUtility");
            Assertions.assertEquals(":example!",
                type.getMethod("getValue").invoke(type.getConstructor().newInstance()));
        }
    }

    @Test
    void inheritedInstanceContractsCannotBeTrimmed() {
        OptionalUtilityTemplate template = new OptionalUtilityTemplate("ClientCoreOperationLocationPollingStrategy",
            "OperationLocationPollingStrategy");
        IllegalArgumentException exception = Assertions.assertThrows(IllegalArgumentException.class,
            () -> template.write(Set.of("getResult"), new JavaFile("OperationLocationPollingStrategy.java")));
        Assertions.assertTrue(exception.getMessage().contains("inheritance contracts"));
    }

    static Stream<Arguments> multipartValues() {
        return Stream.of("serializeTextField", "serializeJsonField", "serializeFileField", "serializeFileFields")
            .flatMap(method -> Stream.of(Arguments.of(method, false), Arguments.of(method, true)));
    }

    @ParameterizedTest
    @MethodSource("multipartValues")
    void trimmedMultipartSerializationMatchesTheFullCatalog(String method, boolean nullValue) throws Exception {
        compile("example." + MULTIPART,
            render("GenericMultipartFormDataHelper", MULTIPART, Set.of(method, "end", "getRequestBody")));
        try (InputStream resource = getClass().getResourceAsStream("/GenericMultipartFormDataHelper.java")) {
            compile("baseline." + MULTIPART,
                "package baseline;\n" + new String(resource.readAllBytes(), StandardCharsets.UTF_8));
        }
        try (URLClassLoader loader = loader()) {
            byte[] expected = multipartBody(loader.loadClass("baseline." + MULTIPART), method, nullValue);
            byte[] actual = multipartBody(loader.loadClass("example." + MULTIPART), method, nullValue);
            Assertions.assertArrayEquals(expected, actual);
            if (!nullValue) {
                Assertions.assertTrue(new String(actual, StandardCharsets.UTF_8).contains("name%22%0D%0A"));
            }
        }
    }

    private static byte[] multipartBody(Class<?> type, String method, boolean nullValue) throws Exception {
        Constructor<?> constructor = type.getDeclaredConstructor(RequestContext.class, String.class);
        constructor.setAccessible(true);
        Object helper = constructor.newInstance(RequestContext.builder().build(), "test-boundary");
        String field = "name\"\r\n";
        switch (method) {
            case "serializeTextField":
                type.getMethod(method, String.class, String.class).invoke(helper, field, nullValue ? null : "value");
                break;

            case "serializeJsonField":
                type.getMethod(method, String.class, Object.class)
                    .invoke(helper, field, nullValue ? null : Map.of("value", "json"));
                break;

            case "serializeFileField":
                type.getMethod(method, String.class, BinaryData.class, String.class, String.class)
                    .invoke(helper, field, nullValue ? null : BinaryData.fromString("file"), null, "file\"\n.txt");
                break;

            case "serializeFileFields":
                type.getMethod(method, String.class, List.class, List.class, List.class)
                    .invoke(helper, field,
                        nullValue ? null : List.of(BinaryData.fromString("first"), BinaryData.fromString("second")),
                        Arrays.asList(null, "text/plain"), List.of("first.txt", "second.txt"));
                break;

            default:
                throw new IllegalArgumentException(method);
        }
        type.getMethod("end").invoke(helper);
        BinaryData body = (BinaryData) type.getMethod("getRequestBody").invoke(helper);
        byte[] bytes = body.toBytes();
        Assertions.assertEquals(bytes.length, body.getLength());
        return bytes;
    }

    private URLClassLoader loader() throws Exception {
        return new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader());
    }

    private static OptionalUtilityTemplate multipartTemplate() {
        return new OptionalUtilityTemplate("GenericMultipartFormDataHelper", MULTIPART);
    }

    private static JavaFile caller(String contents) {
        JavaFile file = new JavaFile("Caller.java");
        file.line(contents);
        return file;
    }

    private static String render(String resourceName, String className, Set<String> required) {
        JavaFile file = new JavaFile(className + ".java");
        file.declarePackage("example");
        new OptionalUtilityTemplate(resourceName, className).write(required, file);
        return file.getContents().toString();
    }

    private static Set<String> methods(String source) {
        return StaticJavaParser.parse(source)
            .findAll(MethodDeclaration.class)
            .stream()
            .map(MethodDeclaration::getNameAsString)
            .collect(Collectors.toSet());
    }

    private void compile(String className, String contents) throws Exception {
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        JavaFileObject source = new SimpleJavaFileObject(
            URI.create("string:///" + className.replace('.', '/') + ".java"), JavaFileObject.Kind.SOURCE) {
            @Override
            public CharSequence getCharContent(boolean ignoreEncodingErrors) {
                return contents;
            }
        };
        String classpath = System.getProperty("surefire.test.class.path", System.getProperty("java.class.path"));
        try (var manager = ToolProvider.getSystemJavaCompiler().getStandardFileManager(diagnostics, null, null)) {
            boolean compiled = ToolProvider.getSystemJavaCompiler()
                .getTask(null, manager, diagnostics,
                    List.of("--release", "11", "-proc:none", "-classpath", classpath, "-d", classes.toString()), null,
                    List.of(source))
                .call();
            Assertions.assertTrue(compiled, () -> diagnostics.getDiagnostics() + "\n" + contents);
        }
    }
}
