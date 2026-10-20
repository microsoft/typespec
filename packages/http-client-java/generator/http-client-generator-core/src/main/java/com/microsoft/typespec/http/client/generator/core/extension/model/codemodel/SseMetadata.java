// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.List;

/**
 * Describes an experimental server-sent event operation.
 */
public class SseMetadata {
    private String streamName;
    private List<SseEventMetadata> events = new ArrayList<>();

    public String getStreamName() {
        return streamName;
    }

    public void setStreamName(String streamName) {
        this.streamName = streamName;
    }

    public List<SseEventMetadata> getEvents() {
        return events;
    }

    public void setEvents(List<SseEventMetadata> events) {
        this.events = events;
    }
}
