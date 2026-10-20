// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Describes one named event in an experimental server-sent event operation.
 */
public class SseEventMetadata {
    private String name;
    private String wrapperName;
    private Schema payload;
    private boolean terminal;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getWrapperName() {
        return wrapperName;
    }

    public void setWrapperName(String wrapperName) {
        this.wrapperName = wrapperName;
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
