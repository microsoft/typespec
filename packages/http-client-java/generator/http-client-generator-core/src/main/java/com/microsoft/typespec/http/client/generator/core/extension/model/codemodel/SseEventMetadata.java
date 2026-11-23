// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Describes one named event in a server-sent event operation.
 */
public class SseEventMetadata {
    private String name;
    private ObjectSchema eventSchema;
    private boolean terminal;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ObjectSchema getEventSchema() {
        return eventSchema;
    }

    public void setEventSchema(ObjectSchema eventSchema) {
        this.eventSchema = eventSchema;
    }

    public boolean isTerminal() {
        return terminal;
    }

    public void setTerminal(boolean terminal) {
        this.terminal = terminal;
    }
}
