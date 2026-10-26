// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class SseNamingResolverTests {
    @Test
    public void resolvesRetrievalStreamNames() {
        SseNamingResolver.Names names
            = SseNamingResolver.resolve(metadata("RetrievalStreamEvents", "retrieval.started", "response.completed"));

        Assertions.assertEquals("RetrievalStreamEvent", names.getBaseEventName());
        Assertions.assertEquals("RetrievalStreamEventConverter", names.getConverterName());
        Assertions.assertEquals("RetrievalStartedStreamEvent", names.getEventWrapperName("retrieval.started"));
        Assertions.assertEquals("ResponseCompletedStreamEvent", names.getEventWrapperName("response.completed"));
        Assertions.assertEquals("createRetrievalStarted",
            SseNamingResolver.getEventFactoryMethodName("retrieval.started"));
    }

    @Test
    public void preservesKnowledgeBasePrefix() {
        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata("KnowledgeBaseRetrievalStreamEvents",
            "retrieval.started", "activity.completed", "response.completed"));

        Assertions.assertEquals("KnowledgeBaseRetrievalStreamEvent", names.getBaseEventName());
        Assertions.assertEquals("KnowledgeBaseRetrievalStreamEventConverter", names.getConverterName());
        Assertions.assertEquals("knowledge base retrieval", names.getStreamDescription());
        Assertions.assertEquals("KnowledgeBaseRetrievalStartedStreamEvent",
            names.getEventWrapperName("retrieval.started"));
        Assertions.assertEquals("KnowledgeBaseActivityCompletedStreamEvent",
            names.getEventWrapperName("activity.completed"));
        Assertions.assertEquals("KnowledgeBaseResponseCompletedStreamEvent",
            names.getEventWrapperName("response.completed"));
    }

    @Test
    public void rejectsNormalizedEventNameCollisions() {
        IllegalStateException exception = Assertions.assertThrows(IllegalStateException.class, () -> SseNamingResolver
            .resolve(metadata("RetrievalStreamEvents", "retrieval.started", "retrieval-started")));

        Assertions.assertTrue(exception.getMessage().contains("retrieval.started"));
        Assertions.assertTrue(exception.getMessage().contains("retrieval-started"));
        Assertions.assertTrue(exception.getMessage().contains("RetrievalStartedStreamEvent"));
    }

    @Test
    public void escapesDigitLeadingNamesBeforeCheckingCollisions() {
        SseNamingResolver.Names names
            = SseNamingResolver.resolve(metadata("RetrievalStreamEvents", "retrieval.started", "123.done"));
        Assertions.assertEquals("OneTwoThreeDoneStreamEvent", names.getEventWrapperName("123.done"));

        names = SseNamingResolver.resolve(metadata("123Events", "done"));
        Assertions.assertEquals("OneTwoThreeEvent", names.getBaseEventName());
        Assertions.assertEquals("OneTwoThreeEventConverter", names.getConverterName());

        Assertions.assertThrows(IllegalStateException.class, () -> SseNamingResolver
            .resolve(metadata("RetrievalStreamEvents", "retrieval.started", "123.done", "oneTwoThree.done")));
    }

    @Test
    public void resolvesServiceImplementationMethodNames() {
        Assertions.assertEquals("retrieveStreamWithResponse",
            SseNamingResolver.getServiceImplementationMethodName("retrieveStreamWithResponseInternal"));
        Assertions.assertEquals("retrieveStreamWithResponseAsync",
            SseNamingResolver.getServiceImplementationMethodName("retrieveStreamWithResponseInternalAsync"));
    }

    @Test
    public void resolvesDocumentationEvents() {
        SseMetadata metadata = metadata("RetrievalStreamEvents", "retrieval.started", "answer.completed",
            "references.completed", "response.completed", "error");
        metadata.getEvents().get(2).setPayload(new ArraySchema());
        metadata.getEvents().get(3).setTerminal(true);
        metadata.getEvents().get(4).setTerminal(true);

        Assertions.assertEquals("answer.completed", SseNamingResolver.getRepresentativeEventName(metadata));
        Assertions.assertEquals(List.of("error", "response.completed"),
            SseNamingResolver.getTerminalEventNames(metadata));
    }

    private static SseMetadata metadata(String streamName, String... eventNames) {
        SseMetadata metadata = new SseMetadata();
        metadata.setStreamName(streamName);
        metadata
            .setEvents(List.of(eventNames).stream().map(SseNamingResolverTests::event).collect(Collectors.toList()));
        return metadata;
    }

    private static SseEventMetadata event(String name) {
        SseEventMetadata event = new SseEventMetadata();
        event.setName(name);
        return event;
    }
}
