// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.extension.base.model;

/**
 * Represents a message channel.
 */
public enum MessageChannel {
    /**
     * Represents an information message.
     */
    INFORMATION("information"),

    /**
     * Represents a hint message.
     */
    HINT("hint"),

    /**
     * Represents a warning message.
     */
    WARNING("warning"),

    /**
     * Represents a debug message.
     */
    DEBUG("debug"),

    /**
     * Represents a verbose message.
     */
    VERBOSE("verbose"),

    /**
     * Represents an error message.
     */
    ERROR("error"),

    /**
     * Represents a fatal message.
     */
    FATAL("fatal"),

    /**
     * Represents a file message.
     */
    FILE("file"),

    /**
     * Represents a configuration message.
     */
    CONFIGURATION("configuration");

    private final String value;

    MessageChannel(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return this.value;
    }
}
