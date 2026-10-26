// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.NumberSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import java.util.List;
import java.util.function.Function;
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
    public void fingerprintsDictionaryValuesRecursively() {
        for (Function<Schema, Schema> collection : List.<Function<Schema, Schema>>of(
            SseMetadataRegistryTests::dictionary, value -> array(dictionary(value)),
            value -> dictionary(dictionary(array(value))))) {
            StringSchema string = new StringSchema();
            string.setType(Schema.AllSchemaTypes.STRING);
            NumberSchema integer = new NumberSchema();
            integer.setType(Schema.AllSchemaTypes.INTEGER);
            integer.setPrecision(32);
            SseMetadataRegistry registry = new SseMetadataRegistry();
            registry.add(metadata("TestEvents", event("message", collection.apply(string), false)));
            registry.add(metadata("TestEvents", event("message", collection.apply(string), false)));
            Assertions.assertEquals(1, registry.values().size());

            IllegalStateException exception = Assertions.assertThrows(IllegalStateException.class,
                () -> registry.add(metadata("TestEvents", event("message", collection.apply(integer), false))));

            Assertions.assertTrue(exception.getMessage().contains("TestEventConverter"));
            Assertions.assertEquals(1, registry.values().size());
        }
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
        metadata.setModelNamespace("com.azure.mock");
        metadata.setEvents(List.of(events));
        return metadata;
    }

    private static SseEventMetadata event(String name, String payloadName, boolean terminal) {
        return event(name, payload(payloadName), terminal);
    }

    private static SseEventMetadata event(String name, Schema payload, boolean terminal) {
        SseEventMetadata event = new SseEventMetadata();
        event.setName(name);
        event.setPayload(payload);
        event.setTerminal(terminal);
        return event;
    }

    private static DictionarySchema dictionary(Schema value) {
        DictionarySchema schema = new DictionarySchema();
        schema.setType(Schema.AllSchemaTypes.DICTIONARY);
        schema.setElementType(value);
        return schema;
    }

    private static ArraySchema array(Schema value) {
        ArraySchema schema = new ArraySchema();
        schema.setType(Schema.AllSchemaTypes.ARRAY);
        schema.setElementType(value);
        return schema;
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
