// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.github.javaparser.ast.expr.StringLiteralExpr;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.util.ModelTemplateHeaderHelper;
import io.clientcore.core.http.models.HttpHeaderName;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.lang.reflect.ParameterizedType;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import javax.lang.model.SourceVersion;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class ClientCoreConstantsTemplateTests {
    @TempDir
    Path classes;

    @Test
    void sharesHeadersAndNestedTypesAcrossPackages() throws Exception {
        List<JavaFile> files = new ArrayList<>();
        files.add(source("first/First.java", "package first; import java.lang.reflect.ParameterizedType; "
            + "import java.util.Map; import java.util.List; import io.clientcore.core.utils.CoreUtils; "
            + "import io.clientcore.core.http.models.HttpHeaderName; public class First { "
            + "public static ParameterizedType type() { return CoreUtils.createParameterizedType(Map.class, String.class, CoreUtils.createParameterizedType(List.class, Integer.class)); } "
            + "public static HttpHeaderName header() { return HttpHeaderName.fromString(\"x-test\"); } }"));
        files.add(source("second/Second.java", "package second; public class Second { "
            + "public static java.lang.reflect.ParameterizedType type() { return io.clientcore.core.utils.CoreUtils.createParameterizedType(java.util.Map.class, java.lang.String.class, io.clientcore.core.utils.CoreUtils.createParameterizedType(java.util.List.class, java.lang.Integer.class)); } "
            + "public static io.clientcore.core.http.models.HttpHeaderName header() { return io.clientcore.core.http.models.HttpHeaderName.fromString(\"x-test\"); } }"));
        JavaFile constants = constants();
        Assertions.assertTrue(template().write(files, constants));
        String output = constants.getContents().toString();
        Assertions.assertEquals(1, output.split("HttpHeaderName.fromString", -1).length - 1, output);
        Assertions.assertEquals(2, output.split("CoreUtils.createParameterizedType", -1).length - 1, output);
        Assertions.assertTrue(output.contains("ParameterizedType LIST_OF_INTEGER_TYPE"), output);
        Assertions.assertTrue(output.contains("ParameterizedType MAP_OF_STRING_AND_LIST_OF_INTEGER_TYPE"), output);
        Assertions.assertTrue(output.indexOf("ParameterizedType LIST_OF_INTEGER_TYPE")
            < output.indexOf("ParameterizedType MAP_OF_STRING_AND_LIST_OF_INTEGER_TYPE"), output);
        Assertions.assertFalse(files.get(0).getContents().toString().contains("CoreUtils.createParameterizedType("));
        Assertions.assertFalse(files.get(1).getContents().toString().contains("HttpHeaderName.fromString("));
        files.add(constants);
        compile(files);
        try (URLClassLoader loader = loader()) {
            Class<?> first = loader.loadClass("first.First");
            Class<?> second = loader.loadClass("second.Second");
            Object type = first.getMethod("type").invoke(null);
            Assertions.assertSame(type, second.getMethod("type").invoke(null));
            ParameterizedType map = (ParameterizedType) type;
            Assertions.assertEquals(java.util.Map.class, map.getRawType());
            Assertions.assertEquals(String.class, map.getActualTypeArguments()[0]);
            ParameterizedType list = (ParameterizedType) map.getActualTypeArguments()[1];
            Assertions.assertEquals(java.util.List.class, list.getRawType());
            Assertions.assertEquals(Integer.class, list.getActualTypeArguments()[0]);
            Class<?> shared = loader.loadClass("example.implementation.ExampleConstants");
            Assertions.assertSame(map, shared.getField("MAP_OF_STRING_AND_LIST_OF_INTEGER_TYPE").get(null));
            Assertions.assertSame(list, shared.getField("LIST_OF_INTEGER_TYPE").get(null));
            Assertions.assertSame(first.getMethod("header").invoke(null), second.getMethod("header").invoke(null));
        }
    }

    @Test
    void resolvesSameSimpleModelNamesWithoutMixingTheirTypes() throws Exception {
        List<JavaFile> files = new ArrayList<>();
        files.add(source("a/Model.java", "package a; public class Model {}"));
        files.add(source("b/Model.java", "package b; public class Model {}"));
        for (String name : List.of("a", "b")) {
            files.add(source(name + "/Client.java", "package " + name + "; import io.clientcore.core.utils.CoreUtils; "
                + "public class Client { public static java.lang.reflect.ParameterizedType type() { return CoreUtils.createParameterizedType(Model.class); } }"));
        }
        JavaFile constants = constants();
        Assertions.assertTrue(template().write(files, constants));
        Assertions.assertTrue(constants.getContents().toString().contains("ParameterizedType MODEL_TYPE ="));
        Assertions.assertTrue(constants.getContents().toString().contains("ParameterizedType MODEL_TYPE_1 ="));
        files.add(constants);
        compile(files);
        try (URLClassLoader loader = loader()) {
            ParameterizedType first = (ParameterizedType) loader.loadClass("a.Client").getMethod("type").invoke(null);
            ParameterizedType second = (ParameterizedType) loader.loadClass("b.Client").getMethod("type").invoke(null);
            Assertions.assertEquals("a.Model", first.getRawType().getTypeName());
            Assertions.assertEquals("b.Model", second.getRawType().getTypeName());
            Assertions.assertNotSame(first, second);
        }
    }

    @Test
    void leavesDynamicAndInaccessibleValuesLocal() throws Exception {
        String code
            = "package first; import io.clientcore.core.utils.CoreUtils; import io.clientcore.core.http.models.HttpHeaderName; "
                + "public class Dynamic { private static class Hidden {} "
                + "public Object type(Class<?> type) { return CoreUtils.createParameterizedType(type); } "
                + "public Object hidden() { return CoreUtils.createParameterizedType(Hidden.class); } "
                + "public Object local() { class Local {} return CoreUtils.createParameterizedType(Local.class); } "
                + "public Object header(String name) { return HttpHeaderName.fromString(\"x-\" + name); } }";
        List<JavaFile> files = new ArrayList<>(List.of(source("first/Dynamic.java", code)));
        JavaFile constants = constants();
        Assertions.assertFalse(template().write(files, constants));
        Assertions.assertEquals(code, files.get(0).getContents().toString().trim());
        compile(files);
    }

    @Test
    void preservesHeaderSpellingAndAvoidsFieldAndIdentifierCollisions() throws Exception {
        List<JavaFile> files = new ArrayList<>(List.of(source("first/Client.java", "package first; "
            + "import io.clientcore.core.http.models.HttpHeaderName; public class Client { "
            + "public Object[] headers(String ExampleConstants) { return new Object[] { HttpHeaderName.fromString(\"x-test\"), "
            + "HttpHeaderName.fromString(\"X-Test\"), HttpHeaderName.fromString(\"x_test\") }; } }")));
        JavaFile constants = constants();
        Assertions.assertTrue(template().write(files, constants));
        String output = constants.getContents().toString();
        Assertions.assertTrue(output.contains("HEADER_X_TEST_1"), output);
        Assertions.assertTrue(output.contains("HEADER_X_TEST_2"), output);
        Assertions.assertTrue(
            files.get(0).getContents().toString().contains("example.implementation.ExampleConstants.HEADER_X_TEST"));
        files.add(constants);
        compile(files);
    }

    @ParameterizedTest
    @CsvSource({
        "encode.bytes, EncodeBytesConstants",
        "payload.xml, PayloadXmlConstants",
        "com.example.client_package, ComExampleClientPackageConstants",
        "api.v2, ApiV2Constants" })
    void classNamesUseTheEntireRootPackage(String rootPackage, String expected) {
        Assertions.assertEquals(expected,
            new ClientCoreConstantsTemplate(rootPackage + ".internal", rootPackage).getClassName());
    }

    @Test
    void classNamesRemainValidForEmptyAndUnderscoredPackages() {
        Assertions.assertEquals("ClientConstants",
            new ClientCoreConstantsTemplate("implementation", "").getClassName());
        Assertions.assertTrue(SourceVersion
            .isIdentifier(new ClientCoreConstantsTemplate("_123.api.implementation", "_123.api").getClassName()));
    }

    @Test
    void arrayTypesHaveReadableDistinctNames() throws Exception {
        List<JavaFile> files = new ArrayList<>(List.of(source("first/Arrays.java", "package first; "
            + "import io.clientcore.core.utils.CoreUtils; public class Arrays { "
            + "public static Object primitive() { return CoreUtils.createParameterizedType(java.util.List.class, byte[][].class); } "
            + "public static Object boxed() { return CoreUtils.createParameterizedType(java.util.List.class, Byte[][].class); } }")));
        JavaFile constants = constants();
        Assertions.assertTrue(template().write(files, constants));
        String output = constants.getContents().toString();
        Assertions.assertTrue(output.contains("ParameterizedType LIST_OF_BYTE_ARRAY_ARRAY_TYPE ="), output);
        Assertions.assertTrue(output.contains("ParameterizedType LIST_OF_BYTE_ARRAY_ARRAY_TYPE_1 ="), output);
        files.add(constants);
        compile(files);
        try (URLClassLoader loader = loader()) {
            Class<?> caller = loader.loadClass("first.Arrays");
            ParameterizedType primitive = (ParameterizedType) caller.getMethod("primitive").invoke(null);
            ParameterizedType boxed = (ParameterizedType) caller.getMethod("boxed").invoke(null);
            Assertions.assertEquals(byte[][].class, primitive.getActualTypeArguments()[0]);
            Assertions.assertEquals(Byte[][].class, boxed.getActualTypeArguments()[0]);
        }
    }

    @Test
    void unrelatedTypesDoNotRenumberExistingConstants() {
        String nested = "package first; import io.clientcore.core.utils.CoreUtils; class Nested { "
            + "Object type() { return CoreUtils.createParameterizedType(java.util.List.class, Integer.class); } }";
        String other = "package second; import io.clientcore.core.utils.CoreUtils; class Other { "
            + "Object type() { return CoreUtils.createParameterizedType(java.util.Map.class, String.class, Object.class); } }";
        for (boolean reverse : List.of(false, true)) {
            JavaFile first = source("first/Nested.java", nested);
            JavaFile second = source("second/Other.java", other);
            List<JavaFile> files = new ArrayList<>(reverse ? List.of(second, first) : List.of(first, second));
            Assertions.assertTrue(template().write(files, constants()));
            String rewritten = files.get(reverse ? 1 : 0).getContents().toString();
            Assertions.assertTrue(rewritten.contains("ExampleConstants.LIST_OF_INTEGER_TYPE"), rewritten);
        }
    }

    @Test
    void modelNamesCanMatchThePackageDerivedConstantsClass() throws Exception {
        List<JavaFile> files = new ArrayList<>();
        files.add(source("other/ExampleConstants.java", "package other; public class ExampleConstants {}"));
        files.add(source("first/Client.java", "package first; import other.ExampleConstants; "
            + "import io.clientcore.core.utils.CoreUtils; public class Client { "
            + "public static Object type() { return CoreUtils.createParameterizedType(java.util.List.class, ExampleConstants.class); } }"));
        JavaFile constants = constants();
        Assertions.assertTrue(template().write(files, constants));
        String output = constants.getContents().toString();
        Assertions.assertTrue(output.contains("other.ExampleConstants.class"), output);
        Assertions.assertTrue(files.get(1)
            .getContents()
            .toString()
            .contains("example.implementation.ExampleConstants.LIST_OF_EXAMPLE_CONSTANTS_TYPE"));
        files.add(constants);
        compile(files);
    }

    @Test
    void allKnownHeadersAndCasingVariantsReuseRuntimeConstants() throws Exception {
        StringBuilder caller = new StringBuilder(
            "package first; import io.clientcore.core.http.models.HttpHeaderName; public class Known {");
        Map<String, HttpHeaderName> expected = new LinkedHashMap<>();
        for (Field field : Arrays.stream(HttpHeaderName.class.getDeclaredFields())
            .filter(value -> value.getType() == HttpHeaderName.class
                && Modifier.isPublic(value.getModifiers())
                && Modifier.isStatic(value.getModifiers())
                && Modifier.isFinal(value.getModifiers()))
            .sorted(java.util.Comparator.comparing(Field::getName))
            .collect(java.util.stream.Collectors.toList())) {
            String name = ((HttpHeaderName) field.get(null)).getCaseSensitiveName();
            for (String variant : List.of(name, name.toLowerCase(Locale.ROOT), name.toUpperCase(Locale.ROOT))) {
                String known = ModelTemplateHeaderHelper.getKnownClientCoreHttpHeaderNameConstant(variant);
                Assertions.assertNotNull(known, variant);
                String method = "header" + expected.size();
                expected.put(method, (HttpHeaderName) HttpHeaderName.class.getField(known).get(null));
                caller.append(" public static HttpHeaderName ")
                    .append(method)
                    .append("() { return HttpHeaderName.fromString(")
                    .append(new StringLiteralExpr().setString(variant))
                    .append("); }");
            }
        }
        Assertions.assertFalse(expected.isEmpty());
        caller.append(" }");
        List<JavaFile> files = new ArrayList<>(List.of(source("first/Known.java", caller.toString())));
        JavaFile constants = constants();
        Assertions.assertFalse(template().write(files, constants));
        Assertions.assertFalse(constants.getContents().toString().contains("class ExampleConstants"));
        Assertions.assertFalse(files.get(0).getContents().toString().contains("fromString("));
        compile(files);
        try (URLClassLoader loader = loader()) {
            Class<?> known = loader.loadClass("first.Known");
            for (Map.Entry<String, HttpHeaderName> entry : expected.entrySet()) {
                Assertions.assertSame(entry.getValue(), known.getMethod(entry.getKey()).invoke(null), entry.getKey());
            }
        }
    }

    @Test
    void onlyCustomHeadersCreateSharedFields() throws Exception {
        List<JavaFile> files = new ArrayList<>(List.of(source("first/Mixed.java", "package first; "
            + "import io.clientcore.core.http.models.HttpHeaderName; public class Mixed { "
            + "public static HttpHeaderName[] headers() { return new HttpHeaderName[] { "
            + "HttpHeaderName.fromString(\"content-type\"), HttpHeaderName.fromString(\"ACCEPT\"), "
            + "HttpHeaderName.fromString(\"x-Custom-Header\"), HttpHeaderName.fromString(\"x-Custom-Header\") }; } }")));
        JavaFile constants = constants();
        Assertions.assertTrue(template().write(files, constants));
        String output = constants.getContents().toString();
        Assertions.assertEquals(1, output.split("HttpHeaderName.fromString", -1).length - 1, output);
        Assertions.assertTrue(output.contains("HEADER_X_CUSTOM_HEADER"), output);
        Assertions.assertFalse(output.contains("HEADER_CONTENT_TYPE"), output);
        Assertions.assertFalse(output.contains("HEADER_ACCEPT"), output);
        files.add(constants);
        compile(files);
        try (URLClassLoader loader = loader()) {
            HttpHeaderName[] headers
                = (HttpHeaderName[]) loader.loadClass("first.Mixed").getMethod("headers").invoke(null);
            Assertions.assertSame(HttpHeaderName.CONTENT_TYPE, headers[0]);
            Assertions.assertSame(HttpHeaderName.ACCEPT, headers[1]);
            Assertions.assertEquals("x-Custom-Header", headers[2].getCaseSensitiveName());
            Assertions.assertSame(headers[2], headers[3]);
        }
    }

    @Test
    void staticAndFullyQualifiedFactoriesAddTheRuntimeImport() throws Exception {
        List<JavaFile> files = new ArrayList<>(List.of(source("first/Client.java", "package first; "
            + "import static io.clientcore.core.http.models.HttpHeaderName.fromString; public class Client { "
            + "public static Object first() { return fromString(\"Accept\"); } "
            + "public static Object second() { return io.clientcore.core.http.models.HttpHeaderName.fromString(\"content-length\"); } }")));
        Assertions.assertFalse(template().write(files, constants()));
        String output = files.get(0).getContents().toString();
        Assertions.assertTrue(output.contains("import io.clientcore.core.http.models.HttpHeaderName;"), output);
        Assertions.assertTrue(output.contains("return HttpHeaderName.ACCEPT;"), output);
        Assertions.assertTrue(output.contains("return HttpHeaderName.CONTENT_LENGTH;"), output);
        compile(files);
    }

    @Test
    void knownHeadersAvoidImportedTypeAndIdentifierCollisions() throws Exception {
        List<JavaFile> files = new ArrayList<>();
        files.add(source("other/HttpHeaderName.java", "package other; public class HttpHeaderName { "
            + "public static Object fromString(String name) { return name; } }"));
        files.add(source("first/Client.java", "package first; import other.HttpHeaderName; public class Client { "
            + "public Object first(String HttpHeaderName) { return io.clientcore.core.http.models.HttpHeaderName.fromString(\"Accept\"); } "
            + "public Object custom() { return HttpHeaderName.fromString(\"Accept\"); } }"));
        files.add(source("second/Generic.java", "package second; public class Generic<HttpHeaderName> { "
            + "public static Object header() { return io.clientcore.core.http.models.HttpHeaderName.fromString(\"if-match\"); } }"));
        Assertions.assertFalse(template().write(files, constants()));
        String client = files.get(1).getContents().toString();
        Assertions.assertTrue(client.contains("io.clientcore.core.http.models.HttpHeaderName.ACCEPT"), client);
        Assertions.assertTrue(client.contains("HttpHeaderName.fromString(\"Accept\")"), client);
        Assertions.assertTrue(
            files.get(2).getContents().toString().contains("io.clientcore.core.http.models.HttpHeaderName.IF_MATCH"));
        compile(files);
    }

    @Test
    void knownHeadersAvoidTypesDeclaredInTheSamePackage() throws Exception {
        List<JavaFile> files = new ArrayList<>();
        files.add(source("first/HttpHeaderName.java", "package first; public class HttpHeaderName {}"));
        files.add(source("first/Client.java", "package first; public class Client { public static Object header() { "
            + "return io.clientcore.core.http.models.HttpHeaderName.fromString(\"Content-Type\"); } }"));
        Assertions.assertFalse(template().write(files, constants()));
        Assertions.assertTrue(files.get(1)
            .getContents()
            .toString()
            .contains("io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE"));
        compile(files);
    }

    private static JavaFile source(String path, String code) {
        JavaFile file = new JavaFile(path);
        file.line(code);
        return file;
    }

    private static JavaFile constants() {
        JavaFile file = new JavaFile("example/implementation/" + template().getClassName() + ".java");
        file.declarePackage("example.implementation");
        return file;
    }

    private static ClientCoreConstantsTemplate template() {
        return new ClientCoreConstantsTemplate("example.implementation", "example");
    }

    private URLClassLoader loader() throws Exception {
        return new URLClassLoader(new URL[] { classes.toUri().toURL() }, getClass().getClassLoader());
    }

    private void compile(List<JavaFile> files) throws Exception {
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        List<JavaFileObject> sources = new ArrayList<>();
        for (JavaFile file : files) {
            sources.add(
                new SimpleJavaFileObject(URI.create("string:///" + file.getFilePath()), JavaFileObject.Kind.SOURCE) {
                    @Override
                    public CharSequence getCharContent(boolean ignoreEncodingErrors) {
                        return file.getContents().toString();
                    }
                });
        }
        String classpath = System.getProperty("surefire.test.class.path", System.getProperty("java.class.path"));
        try (var manager = ToolProvider.getSystemJavaCompiler().getStandardFileManager(diagnostics, null, null)) {
            boolean compiled = ToolProvider.getSystemJavaCompiler()
                .getTask(null, manager, diagnostics,
                    List.of("--release", "11", "-proc:none", "-classpath", classpath, "-d", classes.toString()), null,
                    sources)
                .call();
            Assertions.assertTrue(compiled, () -> diagnostics.getDiagnostics().toString());
        }
    }
}
