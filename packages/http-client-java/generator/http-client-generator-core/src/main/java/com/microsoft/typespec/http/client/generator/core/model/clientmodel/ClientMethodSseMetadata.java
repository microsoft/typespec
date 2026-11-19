// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.List;

/**
 * Method-specific information needed to generate a typed server-sent event convenience method.
 */
public final class ClientMethodSseMetadata {
    private final ClassType eventType;
    private final ClassType serializerType;
    private final List<String> terminalEventNames;

    public ClientMethodSseMetadata(ClassType eventType, ClassType serializerType, List<String> terminalEventNames) {
        this.eventType = eventType;
        this.serializerType = serializerType;
        this.terminalEventNames = List.copyOf(terminalEventNames);
    }

    public ClassType getEventType() {
        return eventType;
    }

    public ClassType getSerializerType() {
        return serializerType;
    }

    public List<String> getTerminalEventNames() {
        return terminalEventNames;
    }
}
