// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.Objects;

/**
 * Rendering information for a mapped server-sent event envelope model.
 */
public final class SseModelMetadata {
    private final String streamName;
    private final String eventName;
    private final boolean terminal;
    private final ClassType baseEventType;
    private final ClassType serializerType;

    public SseModelMetadata(String streamName, String eventName, boolean terminal, ClassType baseEventType,
        ClassType serializerType) {
        this.streamName = streamName;
        this.eventName = eventName;
        this.terminal = terminal;
        this.baseEventType = baseEventType;
        this.serializerType = serializerType;
    }

    public String getStreamName() {
        return streamName;
    }

    public String getEventName() {
        return eventName;
    }

    public boolean isTerminal() {
        return terminal;
    }

    public ClassType getBaseEventType() {
        return baseEventType;
    }

    public ClassType getSerializerType() {
        return serializerType;
    }

    public boolean isBaseModel() {
        return eventName == null;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (!(obj instanceof SseModelMetadata)) {
            return false;
        }
        SseModelMetadata other = (SseModelMetadata) obj;
        return terminal == other.terminal
            && baseEventType == other.baseEventType
            && Objects.equals(streamName, other.streamName)
            && Objects.equals(eventName, other.eventName)
            && Objects.equals(serializerType, other.serializerType);
    }

    @Override
    public int hashCode() {
        return Objects.hash(streamName, eventName, terminal, System.identityHashCode(baseEventType), serializerType);
    }
}
