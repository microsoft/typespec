// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Experimental;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ApiMetadata;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.Templates;
import com.microsoft.typespec.http.client.generator.core.util.ExperimentalAnnotationUtil;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import io.clientcore.core.serialization.json.JsonReader;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class ExperimentalAnnotationTests extends JavaSettingsTestBase {
    private static final String ANNOTATION = "com.example.annotations.Preview";

    @Test
    public void disabledByDefault() {
        Assertions.assertNull(JavaSettings.getInstance().getExperimentalAnnotation());
        Assertions.assertNull(ExperimentalAnnotationUtil.getAnnotation(metadata(null)));
    }

    @Test
    public void pluginSettingIsNotRetainedAcrossGenerations() throws Exception {
        try (JsonReader reader = JsonReader
            .fromString("{\"namespace\":\"com.example\",\"experimental-annotation\":\"" + ANNOTATION + "\"}")) {
            new TypeSpecPlugin(EmitterOptions.fromJson(reader), false);
        }
        Assertions.assertEquals(ANNOTATION, JavaSettings.getInstance().getExperimentalAnnotation());

        JavaSettings.clear();
        new TypeSpecPlugin(new EmitterOptions().setNamespace("com.example"), false);
        Assertions.assertNull(JavaSettings.getInstance().getExperimentalAnnotation());
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "",
            "Preview",
            ".Preview",
            "com..Preview",
            "com.example.",
            "com.class.Preview",
            "com.example.1Preview",
            "com.example.Preview;class Injected {}" })
    public void rejectsInvalidAnnotationClassNames(String name) {
        configureJavaSettings(Map.of("experimental-annotation", name));
        Assertions.assertThrows(IllegalArgumentException.class, JavaSettings::getInstance);
    }

    @Test
    public void usesDefaultAndCustomWarnings() {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION));
        Assertions.assertEquals(ANNOTATION, JavaSettings.getInstance().getExperimentalAnnotation());
        Assertions.assertEquals(ANNOTATION, ExperimentalAnnotationUtil.getAnnotation(metadata(null)));
        Assertions.assertEquals(ANNOTATION + "(warningText = \"Custom warning\")",
            ExperimentalAnnotationUtil.getAnnotation(metadata("Custom warning")));
        Assertions.assertEquals(ANNOTATION + "(warningText = \"\")",
            ExperimentalAnnotationUtil.getAnnotation(metadata("")));
        Assertions.assertNull(ExperimentalAnnotationUtil.getAnnotation(new ApiMetadata.Builder().build()));
    }

    @Test
    public void generatesAnnotationWithSingleDefaultedStringElement(@TempDir Path directory) throws Exception {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION));
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        Assertions.assertEquals(1, javaPackage.getJavaFiles().size());
        JavaFile annotation = javaPackage.getJavaFiles().get(0);
        Assertions
            .assertTrue(annotation.getFilePath().replace('\\', '/').endsWith("com/example/annotations/Preview.java"));

        JavaFile usage = new JavaFile("Usage.java");
        usage.declarePackage("com.example");
        ExperimentalAnnotationUtil.write(usage, metadata(null));
        usage.publicFinalClass("Usage", block -> {
            ExperimentalAnnotationUtil.write(block, metadata("Preview \"API\"\nwith a \\ path\tand \r text"));
            block.publicMethod("void preview()", method -> {
            });
        });
        compile(directory, List.of(annotation, usage));

        try (URLClassLoader loader = new URLClassLoader(new URL[] { directory.toUri().toURL() })) {
            Class<?> type = loader.loadClass(ANNOTATION);
            Assertions.assertTrue(type.isAnnotation());
            Assertions.assertEquals(1, type.getDeclaredMethods().length);
            Assertions.assertEquals(String.class, type.getDeclaredMethod("warningText").getReturnType());
            Assertions.assertEquals(ExperimentalAnnotationUtil.DEFAULT_WARNING_TEXT,
                type.getDeclaredMethod("warningText").getDefaultValue());
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void annotatesEnumsAndValues(boolean expandable, @TempDir Path directory) throws Exception {
        configureJavaSettings(
            Map.of("experimental-annotation", ANNOTATION, "flavor", "azure", "stream-style-serialization", "true"));
        JavaSettings.getInstance();
        EnumType type = new EnumType.Builder().packageName("com.example")
            .name("Choice")
            .description("A choice.")
            .expandable(expandable)
            .elementType(ClassType.STRING)
            .apiMetadata(metadata("Enum warning"))
            .values(List.of(new ClientEnumValue("ONE", "one", "One.", metadata("Member warning")),
                new ClientEnumValue("TWO", "two", "Two.", metadata(null)),
                new ClientEnumValue("STABLE", "stable", "Stable.")))
            .build();
        JavaFile file = new JavaFile("Choice.java");
        file.declarePackage("com.example");
        Templates.getEnumTemplate().write(type, file);
        String source = file.getContents().toString();
        Assertions.assertTrue(source.contains("@" + ANNOTATION + "(warningText = \"Enum warning\")"), source);
        Assertions.assertTrue(source.contains("@" + ANNOTATION + "(warningText = \"Member warning\")"), source);
        Assertions.assertEquals(3, source.split("@" + ANNOTATION, -1).length - 1, source);

        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        compile(directory, List.of(javaPackage.getJavaFiles().get(0), file));
    }

    @Test
    public void annotatesModelAndPropertyAccessors(@TempDir Path directory) throws Exception {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION, "stream-style-serialization", "true"));
        ClientModelProperty property = new ClientModelProperty.Builder().name("value")
            .serializedName("value")
            .description("A value.")
            .wireType(ClassType.STRING)
            .clientType(ClassType.STRING)
            .apiMetadata(metadata("Property warning"))
            .build();
        ClientModel model = new ClientModel.Builder().name("Payload")
            .packageName("com.example")
            .description("A payload.")
            .type(new ClassType.Builder().name("Payload").packageName("com.example").build())
            .properties(List.of(property))
            .implementationDetails(new ImplementationDetails.Builder().usages(Set.of(ImplementationDetails.Usage.PUBLIC,
                ImplementationDetails.Usage.INPUT, ImplementationDetails.Usage.OUTPUT)).build())
            .apiMetadata(metadata(null))
            .build();
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        javaPackage.addModel("com.example", "Payload", model);
        String source = javaPackage.getJavaFiles().get(1).getContents().toString();
        Assertions.assertEquals(2, source.split("warningText = \"Property warning\"", -1).length - 1, source);
        Assertions.assertTrue(source.contains("@" + ANNOTATION), source);
        compile(directory, javaPackage.getJavaFiles());
    }

    @Test
    public void annotatesWrappedClientMethods() {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION));
        ClientMethod method = new ClientMethod.Builder().name("read")
            .description("Reads a value.")
            .type(ClientMethodType.SimpleSync)
            .parameters(List.of())
            .returnValue(new ReturnValue("a value", ClassType.STRING))
            .methodVisibility(JavaVisibility.Public)
            .methodVisibilityInWrapperClient(JavaVisibility.Public)
            .apiMetadata(metadata("Operation warning"))
            .build();
        JavaFile file = new JavaFile("Client.java");
        file.publicFinalClass("Client", block -> Templates.getWrapperClientMethodTemplate().write(method, block));
        Assertions.assertTrue(
            file.getContents().toString().contains("@" + ANNOTATION + "(warningText = \"Operation warning\")"));
    }

    @Test
    public void rejectsAnnotationTypeCollisions() {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION));
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        Assertions.assertThrows(IllegalArgumentException.class, javaPackage::addExperimentalAnnotation);
    }

    private static ApiMetadata metadata(String warningText) {
        Experimental experimental = new Experimental();
        experimental.setWarningText(warningText);
        return new ApiMetadata.Builder().experimental(experimental).build();
    }

    private static void compile(Path directory, List<JavaFile> files) throws Exception {
        List<String> arguments
            = new ArrayList<>(List.of("-classpath", System.getProperty("java.class.path"), "-d", directory.toString()));
        for (JavaFile file : files) {
            Path path = directory.resolve(Path.of(file.getFilePath()).getFileName());
            Files.writeString(path, file.getContents().toString(), StandardCharsets.UTF_8);
            arguments.add(path.toString());
        }
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        Assertions.assertEquals(0,
            ToolProvider.getSystemJavaCompiler().run(null, diagnostics, diagnostics, arguments.toArray(new String[0])),
            diagnostics.toString(StandardCharsets.UTF_8));
    }
}
