// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

/**
 * Deduplicates semantic SSE metadata and validates generated type names across streams.
 */
public final class SseMetadataRegistry {
    private final Map<List<Object>, SseMetadata> metadataBySemanticKey = new LinkedHashMap<>();
    private final Map<String, GeneratedNameOwner> generatedNameOwners = new LinkedHashMap<>();

    /**
     * Adds SSE metadata, ignoring a semantically identical stream that was already registered.
     *
     * @param metadata the SSE metadata to add
     */
    public void add(SseMetadata metadata) {
        List<Object> semanticKey = semanticKey(metadata);
        if (metadataBySemanticKey.containsKey(semanticKey)) {
            return;
        }

        SseNamingResolver.Names names = SseNamingResolver.resolve(metadata);
        List<String> generatedNames = new ArrayList<>();
        String eventPackage = SseUtil.getEventPackage(metadata);
        generatedNames.add(eventPackage + "." + names.getBaseEventName());
        generatedNames.add(SseUtil.getConverterPackage() + "." + names.getConverterName());
        metadata.getEvents()
            .stream()
            .map(SseEventMetadata::getName)
            .map(names::getEventWrapperName)
            .map(name -> eventPackage + "." + name)
            .forEach(generatedNames::add);

        Map<String, Boolean> namesInStream = new LinkedHashMap<>();
        Map<String, GeneratedNameOwner> collisions = new LinkedHashMap<>();
        for (String generatedName : generatedNames) {
            if (namesInStream.put(generatedName, Boolean.TRUE) != null) {
                collisions.put(generatedName, new GeneratedNameOwner(metadata.getStreamName()));
            }
            GeneratedNameOwner owner = generatedNameOwners.get(generatedName);
            if (owner != null) {
                collisions.put(generatedName, owner);
            }
        }
        if (!collisions.isEmpty()) {
            throw collision(collisions, metadata.getStreamName());
        }

        metadataBySemanticKey.put(semanticKey, metadata);
        generatedNames.forEach(
            generatedName -> generatedNameOwners.put(generatedName, new GeneratedNameOwner(metadata.getStreamName())));
    }

    /**
     * Gets the unique registered SSE metadata in registration order.
     *
     * @return the registered metadata
     */
    public Collection<SseMetadata> values() {
        return Collections.unmodifiableCollection(metadataBySemanticKey.values());
    }

    private static IllegalStateException collision(Map<String, GeneratedNameOwner> collisions, String streamName) {
        StringJoiner generatedNames = new StringJoiner("', '", "'", "'");
        StringJoiner existingStreamNames = new StringJoiner("', '", "'", "'");
        collisions.forEach((generatedName, owner) -> {
            generatedNames.add(generatedName);
            existingStreamNames.add(owner.streamName);
        });
        return new IllegalStateException("SSE streams " + existingStreamNames + " and '" + streamName
            + "' resolve to duplicate Java types " + generatedNames + ".");
    }

    private static List<Object> semanticKey(SseMetadata metadata) {
        List<Object> key = new ArrayList<>();
        key.add(metadata.getStreamName());
        key.add(metadata.getModelNamespace());
        metadata.getEvents().stream().sorted(Comparator.comparing(SseEventMetadata::getName)).forEach(event -> {
            List<Object> eventKey = new ArrayList<>();
            eventKey.add(event.getName());
            eventKey.add(schemaKey(event.getPayload()));
            eventKey.add(event.isTerminal());
            key.add(eventKey);
        });
        return key;
    }

    private static Object schemaKey(Schema schema) {
        if (schema == null) {
            return "<null>";
        }
        List<Object> key = new ArrayList<>();
        key.add(schema.getClass().getName());
        key.add(schema.getType());
        key.add(schema.getUid());
        key.add(schema.get$key());
        key.add(languageName(schema.getLanguage()));
        if (schema instanceof ArraySchema) {
            key.add(schemaKey(((ArraySchema) schema).getElementType()));
        }
        return key;
    }

    private static String languageName(Languages languages) {
        if (languages == null) {
            return null;
        }
        Language language = languages.getJava() == null ? languages.getDefault() : languages.getJava();
        return language == null ? null : language.getName();
    }

    private static final class GeneratedNameOwner {
        private final String streamName;

        private GeneratedNameOwner(String streamName) {
            this.streamName = streamName;
        }
    }
}
