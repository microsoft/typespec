// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodSseMetadata;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.SseModelMetadata;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

public class SseUtilTests {
    @Test
    public void rejectsFactoryNameCollisionsWithDistinctWrapperNames() {
        SseMetadata metadata = metadata("RetrievalStreamEvents", "retrieval.started", "retrievalStarted");

        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> SseUtil.validateEventFactoryNames(metadata));

        Assertions.assertTrue(exception.getMessage().contains("retrieval.started"));
        Assertions.assertTrue(exception.getMessage().contains("retrievalStarted"));
        Assertions.assertTrue(exception.getMessage().contains("createRetrievalStarted"));
    }

    @Test
    public void preservesDistinctFactoriesWithOverlappingEventPrefixes() {
        Assertions.assertEquals("createRetrievalStarted", SseUtil.getEventFactoryMethodName("retrieval.started"));
        Assertions.assertEquals("createRetrievalStartedCompleted",
            SseUtil.getEventFactoryMethodName("retrievalStarted.completed"));
    }

    @Test
    public void preservesStreamDescriptions() {
        Assertions.assertEquals("knowledge base retrieval",
            SseUtil.getStreamDescription(model("KnowledgeBaseRetrievalStreamEvents")));
        Assertions.assertEquals("SSE", SseUtil.getStreamDescription(model("StreamEvents")));
        Assertions.assertEquals("SSE", SseUtil.getStreamDescription(model("Stream")));
    }

    @ParameterizedTest
    @CsvSource({ "TypedWrappedEvent,typed wrapped event", "ProtocolStreamEvent,protocol" })
    public void describesMappedMethodEventTypes(String eventTypeName, String description) {
        ClassType eventType = new ClassType.Builder().name(eventTypeName).build();
        ClassType serializer = new ClassType.Builder().name(eventTypeName + "Serializer").build();
        ClientMethod method = new ClientMethod.Builder().parameters(List.of())
            .sseMetadata(new ClientMethodSseMetadata(eventType, serializer, List.of()))
            .build();

        Assertions.assertEquals(description, SseUtil.getStreamDescription(method));
    }

    @Test
    public void preservesTerminalEventMetadataOrder() {
        SseMetadata metadata = metadata("RetrievalStreamEvents", "retrieval.started", "answer.completed",
            "references.completed", "response.completed", "error");
        metadata.getEvents().get(3).setTerminal(true);
        metadata.getEvents().get(4).setTerminal(true);

        Assertions.assertEquals(List.of("response.completed", "error"), SseUtil.getTerminalEventNames(metadata));
    }

    private static SseMetadata metadata(String streamName, String... eventNames) {
        SseMetadata metadata = new SseMetadata();
        metadata.setSseStreamId(streamName);
        metadata.setStreamName(streamName);
        metadata.setEvents(List.of(eventNames).stream().map(SseUtilTests::event).collect(Collectors.toList()));
        return metadata;
    }

    private static ClientModel model(String streamName) {
        ClassType eventType = new ClassType.Builder().name(streamName).build();
        ClassType serializer = new ClassType.Builder().name(streamName + "Serializer").build();
        return new ClientModel.Builder().name(streamName)
            .sseMetadata(new SseModelMetadata(streamName, null, false, eventType, serializer))
            .build();
    }

    private static SseEventMetadata event(String name) {
        SseEventMetadata event = new SseEventMetadata();
        event.setName(name);
        return event;
    }
}
