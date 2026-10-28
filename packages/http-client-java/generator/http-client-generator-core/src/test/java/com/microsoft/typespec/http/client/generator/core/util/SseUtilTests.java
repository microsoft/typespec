// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

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
            SseUtil.getStreamDescription(metadata("KnowledgeBaseRetrievalStreamEvents", "started")));
        Assertions.assertEquals("SSE", SseUtil.getStreamDescription(metadata("StreamEvents", "started")));
        Assertions.assertEquals("SSE", SseUtil.getStreamDescription(metadata("Stream", "started")));
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

    private static SseEventMetadata event(String name) {
        SseEventMetadata event = new SseEventMetadata();
        event.setName(name);
        return event;
    }
}
