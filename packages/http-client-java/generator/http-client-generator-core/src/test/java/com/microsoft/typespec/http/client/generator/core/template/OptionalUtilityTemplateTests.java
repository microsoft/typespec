// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpHeaders;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;
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

class OptionalUtilityTemplateTests {
    @TempDir
    Path classes;

    static Stream<Arguments> protocolMethods() {
        return Stream
            .of("send", "setBody", "setMixedBody", "readMixed", "readJson", "readBase64Url", "readResponse",
                "mapResponse", "handleUnexpectedResponse")
            .map(name -> Arguments.of(name,
                name.equals("setMixedBody") ? Set.of("setMixedBody", "setBody") : Set.of(name)));
    }

    @ParameterizedTest
    @MethodSource("protocolMethods")
    void everyProtocolMethodIsIndependentlyOptional(String name, Set<String> expected) throws Exception {
        String source = render("ClientCoreProtocolUtils", "ClientCoreProtocolUtils", Set.of(name));
        Assertions.assertEquals(expected, methods(source));
        compile("ClientCoreProtocolUtils", source);
    }

    static Stream<Arguments> pollingMethods() {
        return Stream.of(Arguments.of("getAbsolutePath", Set.of("getAbsolutePath")),
            Arguments.of("deserializeResponse", Set.of("deserializeResponse")),
            Arguments.of("getRetryAfterFromHeaders",
                Set.of("getRetryAfterFromHeaders", "tryGetRetryDelay", "tryParseLongOrDateTime", "tryParseLong",
                    "tryGetDelayMillis")),
            Arguments.of("tryGetRetryDelay", Set.of("tryGetRetryDelay")),
            Arguments.of("tryParseLongOrDateTime", Set.of("tryParseLongOrDateTime", "tryParseLong")),
            Arguments.of("tryParseLong", Set.of("tryParseLong")),
            Arguments.of("tryGetDelayMillis", Set.of("tryGetDelayMillis", "tryParseLong")));
    }

    @ParameterizedTest
    @MethodSource("pollingMethods")
    void everyPollingMethodKeepsOnlyItsDependencies(String name, Set<String> expected) throws Exception {
        String source = render("ClientCorePollingUtils", "PollingUtils", Set.of(name));
        Assertions.assertEquals(expected, methods(source));
        if (name.equals("getAbsolutePath")) {
            Assertions.assertTrue(source.contains("FORWARD_SLASH"));
            Assertions.assertFalse(source.contains("RETRY_AFTER_MS_HEADER"));
            Assertions.assertFalse(source.contains("ObjectSerializer"));
        }
        compile("PollingUtils", source);
    }

    @Test
    void testsCoverEveryUtilityMethodInTheCatalogs() throws Exception {
        try (InputStream protocol = getClass().getResourceAsStream("/ClientCoreProtocolUtils.java");
            InputStream polling = getClass().getResourceAsStream("/ClientCorePollingUtils.java")) {
            Set<String> protocolNames = StaticJavaParser.parse(protocol)
                .findAll(MethodDeclaration.class)
                .stream()
                .map(MethodDeclaration::getNameAsString)
                .collect(Collectors.toSet());
            Set<String> pollingNames = StaticJavaParser.parse(polling)
                .findAll(MethodDeclaration.class)
                .stream()
                .map(MethodDeclaration::getNameAsString)
                .collect(Collectors.toSet());
            Assertions.assertEquals(protocolNames,
                protocolMethods().map(arguments -> (String) arguments.get()[0]).collect(Collectors.toSet()));
            Assertions.assertEquals(pollingNames,
                pollingMethods().map(arguments -> (String) arguments.get()[0]).collect(Collectors.toSet()));
        }
    }

    @Test
    void protocolAdapterPreservesPerMethodSelection() throws Exception {
        JavaFile caller = new JavaFile("Caller.java");
        caller.line(
            "class Caller { void call() { ClientCoreProtocolUtils.setMixedBody(null, null, null, null, null); } }");
        Set<String> required = ClientCoreProtocolUtilsTemplate.getRequiredMethods(List.of(caller));
        Assertions.assertEquals(Set.of("setMixedBody"), required);
        JavaFile output = new JavaFile("ClientCoreProtocolUtils.java");
        output.declarePackage("example");
        new ClientCoreProtocolUtilsTemplate().write(required, output);
        String source = output.getContents().toString();
        Assertions.assertEquals(Set.of("setMixedBody", "setBody"), methods(source));
        compile("ClientCoreProtocolUtils", source);
    }

    @Test
    void noSelectionEmitsNoUtility() {
        JavaFile file = new JavaFile("Unused.java");
        new OptionalUtilityTemplate("ClientCoreProtocolUtils", "ClientCoreProtocolUtils").write(Set.of(), file);
        Assertions.assertTrue(file.getContents().toString().isEmpty());
    }

    @Test
    void fieldOnlyUsageDoesNotBringInMethods() throws Exception {
        String source = render("ClientCorePollingUtils", "PollingUtils", Set.of("OPERATION_LOCATION_HEADER"));
        Assertions.assertTrue(methods(source).isEmpty());
        Assertions.assertTrue(source.contains("OPERATION_LOCATION_HEADER"));
        Assertions.assertFalse(source.contains("FORWARD_SLASH"));
        Assertions.assertFalse(source.contains("Duration"));
        compile("PollingUtils", source);
    }

    @Test
    void staticImportsAndReferencesSelectOnlyUsedMembers() {
        OptionalUtilityTemplate template
            = new OptionalUtilityTemplate("ClientCoreProtocolUtils", "ClientCoreProtocolUtils");
        JavaFile source = new JavaFile("Caller.java");
        source.line(
            "import static example.ClientCoreProtocolUtils.readJson; class Caller { void call() { readJson(null, null, null); } }");
        Assertions.assertEquals(Set.of("readJson"), template.getRequiredMembers(List.of(source)));
        source = new JavaFile("Wildcard.java");
        source.line(
            "import static example.ClientCoreProtocolUtils.*; class Wildcard { void call() { int local = 1; System.out.println(local); setBody(null, null, null, null); } }");
        Assertions.assertEquals(Set.of("setBody"), template.getRequiredMembers(List.of(source)));
        source = new JavaFile("Reference.java");
        source.line(
            "class Reference { Object reference = (java.util.function.Function<Object, Object>) example.ClientCoreProtocolUtils::readBase64Url; }");
        Assertions.assertEquals(Set.of("readBase64Url"), template.getRequiredMembers(List.of(source)));
    }

    @Test
    void staticFieldImportsAreOptionalToo() {
        OptionalUtilityTemplate template = new OptionalUtilityTemplate("ClientCorePollingUtils", "PollingUtils");
        JavaFile source = new JavaFile("Fields.java");
        source.line("import static example.PollingUtils.HTTP_METHOD; class Fields { String value = HTTP_METHOD; }");
        Assertions.assertEquals(Set.of("HTTP_METHOD"), template.getRequiredMembers(List.of(source)));
    }

    @Test
    void selectedRetryMethodsRetainWorkingPrivateDependencies() throws Exception {
        String source = render("ClientCorePollingUtils", "PollingUtils", Set.of("getRetryAfterFromHeaders"));
        compile("PollingUtils", source);
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> type = loader.loadClass("example.PollingUtils");
            Method method = type.getDeclaredMethod("getRetryAfterFromHeaders", HttpHeaders.class, Supplier.class);
            method.setAccessible(true);
            HttpHeaders headers = new HttpHeaders().set(HttpHeaderName.fromString("x-ms-retry-after-ms"), "1250");
            Assertions.assertEquals(Duration.ofMillis(1250),
                method.invoke(null, headers, (Supplier<OffsetDateTime>) OffsetDateTime::now));
            headers = new HttpHeaders().set(HttpHeaderName.RETRY_AFTER, "3");
            Assertions.assertEquals(Duration.ofSeconds(3),
                method.invoke(null, headers, (Supplier<OffsetDateTime>) OffsetDateTime::now));
        }
    }

    @Test
    void unknownMembersFailWithADiagnostic() {
        IllegalArgumentException exception = Assertions.assertThrows(IllegalArgumentException.class,
            () -> render("ClientCoreProtocolUtils", "ClientCoreProtocolUtils", Set.of("doesNotExist")));
        Assertions.assertTrue(exception.getMessage().contains("doesNotExist"));
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
        JavaFileObject source = new SimpleJavaFileObject(URI.create("string:///example/" + className + ".java"),
            JavaFileObject.Kind.SOURCE) {
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
