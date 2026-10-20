// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class SseMetadataRegistryTests {
    @Test
    public void deduplicatesSemanticallyIdenticalMetadata() {
        SseMetadataRegistry registry = new SseMetadataRegistry();

        registry.add(metadata("RetrievalStreamEvents", event("retrieval.started", "RetrievalStarted", false)));
        registry.add(metadata("RetrievalStreamEvents", event("retrieval.started", "RetrievalStarted", false)));

        Assertions.assertEquals(1, registry.values().size());
    }

    @Test
    public void rejectsSemanticallyDifferentMetadataWithTheSameGeneratedNames() {
        SseMetadataRegistry registry = new SseMetadataRegistry();
        registry.add(metadata("RetrievalStreamEvents", event("retrieval.started", "RetrievalStarted", false)));

        IllegalStateException exception = Assertions.assertThrows(IllegalStateException.class, () -> registry
            .add(metadata("RetrievalStreamEvents", event("retrieval.started", "RetrievalStarted", true))));

        Assertions.assertTrue(exception.getMessage().contains("RetrievalStreamEventConverter"));
    }

    @Test
    public void rejectsConverterNameCollisionsAcrossStreams() {
        SseMetadataRegistry registry = new SseMetadataRegistry();
        registry.add(metadata("Foo_BarEvents", event("foo.started", "FooStarted", false)));

        IllegalStateException exception = Assertions.assertThrows(IllegalStateException.class,
            () -> registry.add(metadata("FooBarEvents", event("bar.completed", "BarCompleted", true))));

        Assertions.assertTrue(exception.getMessage().contains("FooBarEventConverter"));
        Assertions.assertTrue(exception.getMessage().contains("Foo_BarEvents"));
        Assertions.assertTrue(exception.getMessage().contains("FooBarEvents"));
    }

    @Test
    public void rejectsBaseSubtypeFileNameCollisionsAcrossStreams() {
        SseMetadataRegistry registry = new SseMetadataRegistry();
        registry.add(metadata("BarEventFooStreamEvents", event("bar.started", "BarStarted", false)));

        IllegalStateException exception = Assertions.assertThrows(IllegalStateException.class,
            () -> registry.add(metadata("BarEvents", event("foo", "FooPayload", false))));

        Assertions.assertTrue(exception.getMessage().contains("BarEventFooStreamEvent"));
        Assertions.assertTrue(exception.getMessage().contains("BarEventFooStreamEvents"));
        Assertions.assertTrue(exception.getMessage().contains("BarEvents"));
    }

    private static SseMetadata metadata(String streamName, SseEventMetadata... events) {
        SseMetadata metadata = new SseMetadata();
        metadata.setStreamName(streamName);
        metadata.setEvents(List.of(events));
        return metadata;
    }

    private static SseEventMetadata event(String name, String payloadName, boolean terminal) {
        SseEventMetadata event = new SseEventMetadata();
        event.setName(name);
        event.setPayload(payload(payloadName));
        event.setTerminal(terminal);
        return event;
    }

    private static ObjectSchema payload(String name) {
        Language language = new Language();
        language.setName(name);
        Languages languages = new Languages();
        languages.setDefault(language);
        languages.setJava(language);
        ObjectSchema schema = new ObjectSchema();
        schema.setLanguage(languages);
        return schema;
    }
}
