// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Describes one event variant in a server-sent event definition.
 */
public class SseEventMetadata {
    private String name;
    private Schema payload;
    private boolean terminal;
    private String payloadContentType = "application/json";

    public String getPayloadContentType() {
        return payloadContentType;
    }

    public void setPayloadContentType(String payloadContentType) {
        this.payloadContentType = payloadContentType;
    }

    public String getWireName() {
        return name == null || name.isEmpty() ? "message" : name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Schema getPayload() {
        return payload;
    }

    public void setPayload(Schema payload) {
        this.payload = payload;
    }

    public boolean isTerminal() {
        return terminal;
    }

    public void setTerminal(boolean terminal) {
        this.terminal = terminal;
    }
}
