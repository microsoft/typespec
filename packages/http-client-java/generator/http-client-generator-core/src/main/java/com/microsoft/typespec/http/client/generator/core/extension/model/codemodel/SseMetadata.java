// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.List;

/**
 * Describes a server-sent event operation.
 */
public class SseMetadata {
    private String sseStreamId;
    private String streamName;
    private String modelNamespace;
    private List<SseEventMetadata> events = new ArrayList<>();

    public String getSseStreamId() {
        return sseStreamId;
    }

    public void setSseStreamId(String sseStreamId) {
        this.sseStreamId = sseStreamId;
    }

    public String getStreamName() {
        return streamName;
    }

    public void setStreamName(String streamName) {
        this.streamName = streamName;
    }

    public String getModelNamespace() {
        return modelNamespace;
    }

    public void setModelNamespace(String modelNamespace) {
        this.modelNamespace = modelNamespace;
    }

    public List<SseEventMetadata> getEvents() {
        return events;
    }

    public void setEvents(List<SseEventMetadata> events) {
        this.events = events;
    }
}
