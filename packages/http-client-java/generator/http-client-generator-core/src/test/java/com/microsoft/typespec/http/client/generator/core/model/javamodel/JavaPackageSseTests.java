// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.ResourceLock;

@ResourceLock("ClientModels")
public class JavaPackageSseTests {
    @Test
    public void preservesEofOnlyRuntimeOverloads() throws IOException {
        String implementation = readResource("ServerSentEventStream.java");
        String facade = readResource("ServerSentEventStreams.java");

        Assertions.assertTrue(
            implementation.contains("toFlux(Response<BinaryData> response, BiFunction<String, String, T> converter)"));
        Assertions.assertTrue(implementation.contains(
            "toIterableStream(Response<BinaryData> response,\n        BiFunction<String, String, T> converter)"));
        Assertions.assertTrue(
            facade.contains("toFlux(Response<BinaryData> response, BiFunction<String, String, T> converter)"));
        Assertions.assertTrue(facade.contains(
            "toIterableStream(Response<BinaryData> response,\n        BiFunction<String, String, T> converter)"));
    }

    @Test
    public void placesSseFilesUsingSemanticNamespaces() {
        JavaSettings.clear();
        JavaPackage javaPackage = new JavaPackage(new MockUnitJavagen());
        SseMetadata metadata = metadata();
        metadata.setStreamName("KnowledgeBaseRetrievalStreamEvents");
        metadata.setClientNamespace("com.azure.search.documents.knowledgebases");
        metadata.setModelNamespace("com.azure.search.documents.knowledgebases");

        javaPackage.addSseEventFiles(metadata);

        Assertions.assertEquals(List.of(
            "src/main/java/com/azure/search/documents/knowledgebases/models/KnowledgeBaseRetrievalStreamEvent.java",
            "src/main/java/com/azure/search/documents/knowledgebases/models/KnowledgeBaseRetrievalStartedStreamEvent.java",
            "src/main/java/com/azure/search/documents/knowledgebases/implementation/KnowledgeBaseRetrievalStreamEventConverter.java"),
            javaPackage.getJavaFiles().stream().map(JavaFile::getFilePath).toList());
        String baseEventSource = javaPackage.getJavaFiles().get(0).getContents().toString();
        String converterSource = javaPackage.getJavaFiles().get(2).getContents().toString();
        Assertions
            .assertTrue(baseEventSource.contains("KnowledgeBaseRetrievalStreamEventConverter.setConstructorAccessor("));
        Assertions.assertTrue(converterSource.contains("public interface ConstructorAccessor"));
        Assertions.assertTrue(converterSource.contains(
            "getConstructorAccessor().createRetrievalStarted(read(eventName, data, reader -> reader.getString()))"));
        Assertions.assertTrue(converterSource.contains("JsonProviders.createReader(data)"));
        Assertions.assertFalse(converterSource.contains("BinaryData.fromString"));
    }

    @Test
    public void rejectsOrdinaryModelCollisionsBeforeAddingSseFiles() {
        for (String collidingClassName : List.of("RetrievalStreamEvent", "RetrievalStartedStreamEvent",
            "RetrievalStreamEventConverter")) {
            JavaSettings.clear();
            JavaPackage javaPackage = new JavaPackage(new MockUnitJavagen());
            String packageName
                = collidingClassName.endsWith("Converter") ? "com.azure.mock.implementation" : "com.azure.mock.models";
            javaPackage.addModel(packageName, collidingClassName,
                new ClientModel.Builder().name(collidingClassName)
                    .packageName(packageName)
                    .properties(List.of())
                    .build());

            IllegalStateException exception
                = Assertions.assertThrows(IllegalStateException.class, () -> javaPackage.addSseEventFiles(metadata()));

            Assertions.assertTrue(exception.getMessage().contains(collidingClassName));
            Assertions.assertEquals(1, javaPackage.getJavaFiles().size());
        }
    }

    private static SseMetadata metadata() {
        SseEventMetadata event = new SseEventMetadata();
        event.setName("retrieval.started");
        StringSchema payload = new StringSchema();
        payload.setType(Schema.AllSchemaTypes.STRING);
        event.setPayload(payload);
        SseMetadata metadata = new SseMetadata();
        metadata.setStreamName("RetrievalStreamEvents");
        metadata.setClientNamespace("com.azure.mock");
        metadata.setModelNamespace("com.azure.mock");
        metadata.setEvents(List.of(event));
        return metadata;
    }

    private static String readResource(String resourceName) throws IOException {
        try (InputStream stream = JavaPackageSseTests.class.getClassLoader().getResourceAsStream(resourceName)) {
            Assertions.assertNotNull(stream);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

}
