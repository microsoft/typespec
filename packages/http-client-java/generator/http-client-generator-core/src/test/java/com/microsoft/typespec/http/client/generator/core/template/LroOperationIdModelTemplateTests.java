// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpMethod;
import com.azure.core.http.HttpPipeline;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.HttpRequest;
import com.azure.core.http.HttpResponse;
import com.azure.core.http.rest.SimpleResponse;
import com.azure.core.util.BinaryData;
import com.azure.core.util.polling.PollingContext;
import com.azure.core.util.polling.PollingStrategy;
import com.azure.core.util.polling.PollingStrategyOptions;
import com.azure.core.util.polling.SyncPollingStrategy;
import com.azure.core.util.serializer.TypeReference;
import com.azure.json.JsonProviders;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;
import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.LongRunningOperationIdMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Constructor;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Isolated
public class LroOperationIdModelTemplateTests {
    @TempDir
    Path compilationDirectory;

    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
        ClientModels.getInstance().clear();
    }

    @Test
    public void selectedExistingGetterFallsBackToPath() {
        new MockUnitJavagen();
        JavaSettings.clear();
        ClientModel model = model("SelectedOperationId", List.of(property("operationId", ClassType.STRING)), null);
        String source = render(model);
        Assertions.assertTrue(
            source.contains("return this.operationId != null ? this.operationId : this.lroOperationId;"), source);
        Assertions.assertEquals(source.indexOf("String getOperationId()"),
            source.lastIndexOf("String getOperationId()"));
    }

    @Test
    public void inheritedSelectedGetterFallsBackToPath() {
        new MockUnitJavagen();
        JavaSettings.clear();
        ClientModel parent = new ClientModel.Builder().name("OperationIdParent")
            .packageName("com.azure.mock.models")
            .properties(List.of(property("operationId", ClassType.STRING)))
            .build();
        ClientModels.getInstance().addModel(parent);
        String source = render(model("OperationIdChild", List.of(), parent.getName()));
        Assertions.assertTrue(source.contains("String propertyValue = super.getOperationId();"), source);
        Assertions.assertTrue(source.contains("return propertyValue != null ? propertyValue : this.lroOperationId;"),
            source);
    }

    @Test
    public void unsupportedOrConflictingPropertyDoesNotGenerateAnInvalidGetter() {
        new MockUnitJavagen();
        JavaSettings.clear();
        String nonString = render(model("UuidOperationId", List.of(property("operationId", ClassType.UUID)), null));
        Assertions.assertFalse(nonString.contains("private String lroOperationId"), nonString);
        String collision
            = render(model("CollidingOperationId", List.of(property("lroOperationId", ClassType.STRING)), null));
        Assertions.assertFalse(collision.contains("setOperationIdAccessor"), collision);
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void inheritedOperationIdDoesNotChangeWireValue(boolean metadataOnParent) throws Exception {
        new MockUnitJavagen() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                return "stream-style-serialization".equals(key) ? (T) Boolean.TRUE : super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
        ClientModel parent = model("WireParent", List.of(property("operationId", ClassType.STRING)), null);
        if (!metadataOnParent) {
            parent = new ClientModel.Builder().name("WireParent")
                .packageName("com.azure.mock.models")
                .properties(parent.getProperties())
                .derivedModels(new ArrayList<>())
                .build();
        }
        ClientModel child = model("WireChild", List.of(), parent.getName());
        parent.getDerivedModels().add(child);
        ClientModels.getInstance().addModel(parent);
        ClientModels.getInstance().addModel(child);
        try (URLClassLoader loader = compile(parent, child)) {
            Class<?> childType = loader.loadClass(child.getFullName());
            Class<?> helper = loader.loadClass("com.azure.mock.implementation.OperationIdPollingStrategy");
            java.lang.reflect.Method populate = helper.getDeclaredMethod("setOperationId",
                com.azure.core.util.polling.PollResponse.class, PollingContext.class, java.util.regex.Pattern.class);
            populate.setAccessible(true);
            for (String json : List.of("{}", "{\"operationId\":\"body-id\"}")) {
                Object value;
                try (JsonReader reader = JsonProviders.createReader(json)) {
                    value = childType.getMethod("fromJson", JsonReader.class).invoke(null, reader);
                }
                PollingContext<Object> context = context();
                context.setData(helper.getName() + ".pollingUrl", "https://example.test/operations/path-id");
                populate.invoke(null,
                    new com.azure.core.util.polling.PollResponse<>(
                        com.azure.core.util.polling.LongRunningOperationStatus.IN_PROGRESS, value),
                    context, java.util.regex.Pattern.compile("/operations/([^/]+)$"));
                Assertions.assertEquals(json.contains("body-id") ? "body-id" : "path-id",
                    childType.getMethod("getOperationId").invoke(value));
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                try (JsonWriter writer = JsonProviders.createWriter(output)) {
                    ((JsonSerializable<?>) value).toJson(writer);
                }
                try (JsonReader reader = JsonProviders.createReader(output.toString(StandardCharsets.UTF_8))) {
                    java.util.Map<String, Object> wire = reader.readMap(JsonReader::readUntyped);
                    Assertions.assertEquals(json.contains("body-id") ? "body-id" : null, wire.get("operationId"));
                    Assertions.assertFalse(wire.containsValue("path-id"), wire.toString());
                }
                try (JsonReader reader = JsonProviders.createReader(output.toString(StandardCharsets.UTF_8))) {
                    Object roundTripped = childType.getMethod("fromJson", JsonReader.class).invoke(null, reader);
                    Assertions.assertEquals(json.contains("body-id") ? "body-id" : null,
                        childType.getMethod("getOperationId").invoke(roundTripped));
                }
            }
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    @SuppressWarnings("unchecked")
    public void pollsSelectedLocationHeaderWithAndWithoutOperationId(boolean async) throws Exception {
        try (URLClassLoader loader = compile()) {
            List<String> requestedUrls = new ArrayList<>();
            HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> {
                requestedUrls.add(request.getUrl().toString());
                return Mono.just(response(request, "{\"status\":\"Succeeded\"}"));
            }).build();
            PollingStrategyOptions options = new PollingStrategyOptions(pipeline).setEndpoint("https://example.test");
            Class<?> type = loader.loadClass("com.azure.mock.implementation."
                + (async ? "OperationLocationPollingStrategy" : "SyncOperationLocationPollingStrategy"));
            Object delegate = type.getConstructor(PollingStrategyOptions.class, String.class, String.class)
                .newInstance(options, null, "location");
            TypeReference<BinaryData> resultType = TypeReference.createInstance(BinaryData.class);
            Class<?> helper = loader.loadClass("com.azure.mock.implementation.OperationIdPollingStrategy");
            java.util.concurrent.atomic.AtomicReference<String> operationId
                = new java.util.concurrent.atomic.AtomicReference<>();
            helper.getMethod("setOperationIdAccessor", Class.class, BiConsumer.class)
                .invoke(null, BinaryData.class, (BiConsumer<BinaryData, String>) (value, id) -> operationId.set(id));
            for (boolean wrapped : List.of(false, true)) {
                Object strategy = delegate;
                if (wrapped) {
                    Class<?> wrapper = loader.loadClass("com.azure.mock.implementation."
                        + (async ? "OperationIdPollingStrategy" : "SyncOperationIdPollingStrategy"));
                    strategy = wrapper
                        .getConstructor(async ? PollingStrategy.class : SyncPollingStrategy.class, String.class,
                            String.class, String.class, String.class)
                        .newInstance(delegate, "/operations/{id}", "id", "location", "https://example.test");
                }
                for (String url : List.of("operations/a%2Bb?api-version=1", "/operations/a%2Bb?api-version=1",
                    "https://example.test/operations/a%2Bb?api-version=1")) {
                    for (boolean includeDefaultHeader : List.of(false, true)) {
                        HttpHeaders headers = new HttpHeaders().set("Location", url);
                        if (includeDefaultHeader) {
                            headers.set("Operation-Location", "https://example.test/operations/wrong");
                        }
                        SimpleResponse<BinaryData> initial
                            = new SimpleResponse<>(new HttpRequest(HttpMethod.POST, "https://example.test/start"), 202,
                                headers, BinaryData.fromString("{}"));
                        PollingContext<BinaryData> context = context();
                        operationId.set(null);
                        requestedUrls.clear();
                        if (async) {
                            PollingStrategy<BinaryData, BinaryData> polling
                                = (PollingStrategy<BinaryData, BinaryData>) strategy;
                            Assertions.assertTrue(polling.canPoll(initial).block());
                            polling.onInitialResponse(initial, context, resultType).block();
                            polling.poll(context, resultType).block();
                        } else {
                            SyncPollingStrategy<BinaryData, BinaryData> polling
                                = (SyncPollingStrategy<BinaryData, BinaryData>) strategy;
                            Assertions.assertTrue(polling.canPoll(initial));
                            polling.onInitialResponse(initial, context, resultType);
                            polling.poll(context, resultType);
                        }
                        Assertions.assertEquals(List.of("https://example.test/operations/a%2Bb?api-version=1"),
                            requestedUrls);
                        Assertions.assertEquals(wrapped ? "a+b" : null, operationId.get());
                    }
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private static <T> PollingContext<T> context() throws Exception {
        Constructor<?> constructor = PollingContext.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        return (PollingContext<T>) constructor.newInstance();
    }

    private URLClassLoader compile(ClientModel... models) throws Exception {
        List<String> arguments = new ArrayList<>(
            List.of("-classpath", System.getProperty("java.class.path"), "-d", compilationDirectory.toString()));
        for (String name : List.of("PollingUtils", "OperationLocationPollingStrategy",
            "SyncOperationLocationPollingStrategy", "OperationIdPollingStrategy", "SyncOperationIdPollingStrategy")) {
            String source = "package com.azure.mock.implementation;\n" + new MockUnitJavagen().readFile(name + ".java");
            Path path = compilationDirectory.resolve(name + ".java");
            Files.writeString(path, source);
            arguments.add(path.toString());
        }
        for (ClientModel model : models) {
            JavaFile file = new JavaFile(model.getName() + ".java");
            file.declarePackage(model.getPackage());
            StreamSerializationModelTemplate.getInstance().write(model, file);
            Path path = compilationDirectory.resolve(model.getName() + ".java");
            Files.writeString(path, file.getContents().toString());
            arguments.add(path.toString());
        }
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        Assertions.assertEquals(0,
            ToolProvider.getSystemJavaCompiler().run(null, diagnostics, diagnostics, arguments.toArray(new String[0])),
            diagnostics.toString(StandardCharsets.UTF_8));
        return new URLClassLoader(new URL[] { compilationDirectory.toUri().toURL() }, getClass().getClassLoader());
    }

    private static HttpResponse response(HttpRequest request, String body) {
        return new HttpResponse(request) {
            @Override
            public int getStatusCode() {
                return 200;
            }

            @Override
            public String getHeaderValue(String name) {
                return getHeaders().getValue(name);
            }

            @Override
            public HttpHeaders getHeaders() {
                return new HttpHeaders().set("Content-Type", "application/json");
            }

            @Override
            public Flux<ByteBuffer> getBody() {
                return Flux.just(ByteBuffer.wrap(body.getBytes(StandardCharsets.UTF_8)));
            }

            @Override
            public Mono<byte[]> getBodyAsByteArray() {
                return Mono.just(body.getBytes(StandardCharsets.UTF_8));
            }

            @Override
            public Mono<String> getBodyAsString() {
                return Mono.just(body);
            }

            @Override
            public Mono<String> getBodyAsString(Charset charset) {
                return Mono.just(body);
            }
        };
    }

    private static ClientModelProperty property(String name, ClassType type) {
        return new ClientModelProperty.Builder().name(name)
            .serializedName(name)
            .wireType(type)
            .clientType(type)
            .build();
    }

    private static ClientModel model(String name, List<ClientModelProperty> properties, String parent) {
        LongRunningOperationIdMetadata metadata = new LongRunningOperationIdMetadata();
        metadata.setPathTemplate("/operations/{id}");
        metadata.setPathParameterSerializedName("id");
        metadata.setPollingHeaderName("operation-location");
        metadata.setPropertySerializedName("operationId");
        return new ClientModel.Builder().name(name)
            .packageName("com.azure.mock.models")
            .properties(properties)
            .parentModelName(parent)
            .derivedModels(new ArrayList<>())
            .lroOperationId(metadata)
            .build();
    }

    private static String render(ClientModel model) {
        JavaFile file = new JavaFile(model.getName() + ".java");
        ModelTemplate.getInstance().write(model, file);
        return file.getContents().toString();
    }
}
