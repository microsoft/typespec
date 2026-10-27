// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ConvenienceMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Versioning;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.SseNamingResolver;
import com.microsoft.typespec.http.client.generator.core.util.SseUtil;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
public class SseConvenienceMethodTemplateTests {
    @TempDir
    Path compilationDirectory;

    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @Test
    public void avoidsEnclosingParametersAndSuffixes() {
        String output = render(true, List.of("response", "response1"), List.of());
        Assertions.assertTrue(output.contains(".flatMapMany(response2 -> "), output);
        Assertions.assertTrue(output.contains("toFlux(response2, "), output);
    }

    @Test
    public void avoidsTransformationLocalsAndSuffixes() {
        String output = render(true, List.of("response1"), List.of("response", "response2"));
        Assertions.assertTrue(output.contains(".flatMapMany(response3 -> "), output);
        Assertions.assertTrue(output.contains("toFlux(response3, "), output);
    }

    @Test
    public void preservesOrdinaryNamesAndNamedTerminalReferences() {
        for (boolean async : List.of(false, true)) {
            String output = render(async, List.of(), List.of());
            Assertions.assertTrue(output.contains(", test.models.Event::isTerminal)"), output);
            if (async) {
                Assertions.assertTrue(output.contains(".flatMapMany(response -> "), output);
            }
        }
    }

    @Test
    public void preservesFullAuthoredDescriptionAndStandardSseGuidance() {
        String description = "First sentence. Second sentence with https://example.com/v1.2 and "
            + "{@link java.time.Instant#parse(CharSequence)}.\nFinal authored line.";
        for (boolean async : List.of(false, true)) {
            String output = renderMethod(async, description);
            Assertions.assertTrue(output.contains("First sentence."), output);
            Assertions.assertTrue(output.contains("Second sentence with https://example.com/v1.2"), output);
            Assertions.assertTrue(output.contains("{@link java.time.Instant#parse(CharSequence)}"), output);
            Assertions.assertTrue(output.contains("Final authored line."), output);
            Assertions.assertTrue(output.contains("see {@link test.models.Event} for the known subtypes"), output);
            Assertions.assertFalse(output.contains("UpdateStreamEvent#getValue()"), output);
            Assertions.assertTrue(
                output.contains("terminal {@code response.completed} or {@code error} event is emitted before"),
                output);
            Assertions.assertTrue(output.contains("The client does not reconnect automatically."), output);
            if (async) {
                Assertions.assertTrue(output.contains("reactive error path"), output);
            } else {
                Assertions.assertTrue(output.contains("Events are decoded lazily by a single iterator."), output);
                Assertions.assertTrue(output.contains("Use try-with-resources"), output);
            }
        }
    }

    @Test
    public void emptyDescriptionStillRendersSseGuidance() {
        for (boolean async : List.of(false, true)) {
            String output = renderMethod(async, "");
            Assertions.assertTrue(
                output.contains("Events are polymorphic: see {@link test.models.Event} for the known subtypes."),
                output);
            Assertions.assertFalse(output.contains("null"), output);
        }
    }

    @Test
    public void doesNotImportReactorFluxOnlyForSseMethods() {
        SseMetadata metadata = new SseMetadata();
        metadata.setStreamName("Events");
        metadata.setModelNamespace("test");
        metadata.setEvents(List.of(event("update", false)));
        ClientMethod protocol = new ClientMethod.Builder().name("readWithResponseAsync")
            .parameters(List.of())
            .type(ClientMethodType.SimpleAsyncRestResponse)
            .methodVisibility(JavaVisibility.Public)
            .returnValue(new ReturnValue("response", GenericType.mono(GenericType.response(ClassType.BINARY_DATA))))
            .build();
        ClientMethod convenience = new ClientMethod.Builder().name("read")
            .parameters(List.of())
            .sseMetadata(metadata)
            .type(ClientMethodType.SseAsync)
            .methodVisibility(JavaVisibility.Public)
            .returnValue(new ReturnValue("events", GenericType.flux(SseUtil.getEventType(metadata, "Event"))))
            .build();
        Set<String> imports = new HashSet<>();

        ConvenienceAsyncMethodTemplate.getInstance()
            .addImports(imports, List.of(new ConvenienceMethod(protocol, List.of(convenience))));

        Assertions.assertFalse(imports.contains(ClassType.FLUX.getFullName()), imports.toString());
    }

    @Test
    public void qualifiesVersionedSseFluxError() throws IOException {
        ClientMethodParameter added = new ClientMethodParameter.Builder().name("added")
            .annotations(List.of())
            .wireType(ClassType.STRING)
            .versioning(new Versioning.Builder().added(List.of("2026-01-01")).build())
            .build();
        ClientMethod convenience
            = new ClientMethod.Builder().parameters(List.of()).type(ClientMethodType.SseAsync).build();
        JavaFileContents contents = new JavaFileContents();
        ConvenienceAsyncMethodTemplate.getInstance()
            .writeValidationForVersioning(convenience,
                Set.of(new ConvenienceMethodTemplateBase.MethodParameter(null, added)), new JavaBlock(contents));

        String validation = contents.toString();
        Path modelDirectory = compilationDirectory.resolve("test/models");
        Files.createDirectories(modelDirectory);
        Path model = modelDirectory.resolve("Flux.java");
        Files.writeString(model, "package test.models; public class Flux {}");
        Path client = compilationDirectory.resolve("VersionedSseValidationCompilation.java");
        String source = "package test;\n" + "import java.util.Arrays;\n" + "import test.models.Flux;\n"
            + "public class VersionedSseValidationCompilation {\n"
            + "    private final ServiceClient serviceClient = new ServiceClient();\n"
            + "    public reactor.core.publisher.Flux<String> read(String added) {\n" + validation + "\n"
            + "        return reactor.core.publisher.Flux.empty();\n" + "    }\n"
            + "    private static final class ServiceClient {\n"
            + "        private ServiceVersion getServiceVersion() { return new ServiceVersion(); }\n" + "    }\n"
            + "    private static final class ServiceVersion {\n"
            + "        private String getVersion() { return \"2025-01-01\"; }\n" + "    }\n" + "}\n";
        Files.writeString(client, source);
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        int result = ToolProvider.getSystemJavaCompiler()
            .run(null, diagnostics, diagnostics, "--release", "11", "-classpath",
                System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")), "-d",
                compilationDirectory.toString(), model.toString(), client.toString());

        Assertions.assertEquals(0, result, () -> diagnostics.toString(StandardCharsets.UTF_8) + "\n" + source);
        Assertions.assertTrue(validation.contains("return reactor.core.publisher.Flux.error("), validation);
    }

    private static String render(boolean async, List<String> parameters, List<String> locals) {
        SseEventMetadata event = new SseEventMetadata();
        event.setName("update");
        event.setPayload(new StringSchema());
        event.setTerminal(true);
        SseMetadata metadata = new SseMetadata();
        metadata.setStreamName("Events");
        metadata.setModelNamespace("test");
        metadata.setEvents(List.of(event));
        ProxyMethod proxy = new ProxyMethod.Builder().name("read")
            .parameters(List.of())
            .allParameters(List.of())
            .responseBodyType(ClassType.BINARY_DATA)
            .rawResponseBodyType(ClassType.STRING)
            .responseContentTypes(java.util.Set.of("text/event-stream"))
            .build();
        ClientMethod protocol = new ClientMethod.Builder().name("readWithResponse")
            .parameters(List.of())
            .proxyMethod(proxy)
            .type(async ? ClientMethodType.SimpleAsyncRestResponse : ClientMethodType.SimpleSyncRestResponse)
            .returnValue(new ReturnValue("response",
                async
                    ? GenericType.mono(GenericType.response(ClassType.BINARY_DATA))
                    : GenericType.response(ClassType.BINARY_DATA)))
            .build();
        ClientMethod convenience = new ClientMethod.Builder().name("read")
            .parameters(
                parameters.stream().map(SseConvenienceMethodTemplateTests::parameter).collect(Collectors.toList()))
            .parameterTransformations(new ParameterTransformations(locals.stream()
                .map(name -> new ParameterTransformation(parameter(name), List.of()))
                .collect(Collectors.toList())))
            .proxyMethod(proxy)
            .sseMetadata(metadata)
            .type(async ? ClientMethodType.SseAsync : ClientMethodType.SseSync)
            .returnValue(new ReturnValue("events",
                async ? GenericType.flux(ClassType.STRING) : GenericType.closeableIterableStream(ClassType.STRING)))
            .build();
        JavaFileContents contents = new JavaFileContents();
        ConvenienceMethodTemplateBase template
            = async ? ConvenienceAsyncMethodTemplate.getInstance() : ConvenienceSyncMethodTemplate.getInstance();
        template.writeInvocationAndConversion(convenience, protocol, "requestOptions", new JavaBlock(contents),
            new HashSet<>());
        return contents.toString();
    }

    private static String renderMethod(boolean async, String description) {
        new MockUnitJavagen();
        JavaSettings.clear();
        SseEventMetadata update = event("update", false);
        SseEventMetadata responseCompleted = event("response.completed", true);
        SseEventMetadata error = event("error", true);
        SseMetadata metadata = new SseMetadata();
        metadata.setStreamName("Events");
        metadata.setModelNamespace("test");
        metadata.setEvents(List.of(update, responseCompleted, error));
        ProxyMethod proxy = new ProxyMethod.Builder().name("read")
            .parameters(List.of())
            .allParameters(List.of())
            .responseBodyType(ClassType.BINARY_DATA)
            .rawResponseBodyType(ClassType.STRING)
            .responseContentTypes(java.util.Set.of("text/event-stream"))
            .build();
        ClientMethod protocol = new ClientMethod.Builder().name(async ? "readWithResponseAsync" : "readWithResponse")
            .description(description)
            .parameters(List.of())
            .proxyMethod(proxy)
            .type(async ? ClientMethodType.SimpleAsyncRestResponse : ClientMethodType.SimpleSyncRestResponse)
            .methodVisibility(JavaVisibility.Public)
            .methodVisibilityInWrapperClient(JavaVisibility.Public)
            .returnValue(new ReturnValue("response",
                async
                    ? GenericType.mono(GenericType.response(ClassType.BINARY_DATA))
                    : GenericType.response(ClassType.BINARY_DATA)))
            .build();
        ClassType eventType = SseUtil.getEventType(metadata, SseNamingResolver.resolve(metadata).getBaseEventName());
        ClientMethod convenience = new ClientMethod.Builder().name(async ? "readAsync" : "read")
            .description(description)
            .parameters(List.of())
            .parameterTransformations(new ParameterTransformations(List.of()))
            .proxyMethod(proxy)
            .sseMetadata(metadata)
            .type(async ? ClientMethodType.SseAsync : ClientMethodType.SseSync)
            .methodVisibility(JavaVisibility.Public)
            .methodVisibilityInWrapperClient(JavaVisibility.Public)
            .returnValue(new ReturnValue("events",
                async ? GenericType.flux(eventType) : GenericType.closeableIterableStream(eventType)))
            .build();
        JavaFileContents contents = new JavaFileContents();
        ConvenienceMethodTemplateBase template
            = async ? ConvenienceAsyncMethodTemplate.getInstance() : ConvenienceSyncMethodTemplate.getInstance();
        template.write(new ConvenienceMethod(protocol, List.of(convenience)), new JavaClass(contents), new HashSet<>());
        return contents.toString();
    }

    private static SseEventMetadata event(String name, boolean terminal) {
        StringSchema payload = new StringSchema();
        payload.setType(
            com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema.AllSchemaTypes.STRING);
        SseEventMetadata event = new SseEventMetadata();
        event.setName(name);
        event.setPayload(payload);
        event.setTerminal(terminal);
        return event;
    }

    private static ClientMethodParameter parameter(String name) {
        return new ClientMethodParameter.Builder().name(name).annotations(List.of()).wireType(ClassType.STRING).build();
    }
}
