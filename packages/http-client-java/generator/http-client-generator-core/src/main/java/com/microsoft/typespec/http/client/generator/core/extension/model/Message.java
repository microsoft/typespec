// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model;

import java.util.List;

/**
 * Represents a message.
 */
public class Message {

    /**
     * Represents a message channel.
     */
    public MessageChannel channel;

    /**
     * Represents details.
     */
    public Object details;

    /**
     * Represents text.
     */
    public String text;

    /**
     * Represents a key.
     */
    public List<String> key;

    /**
     * Represents a source location.
     */
    public List<SourceLocation> source;

    /**
     * Creates a new instance of the Message class.
     */
    public Message() {
    }

    /**
     * Gets the source location of the message.
     *
     * @return The source location of the message.
     */
    public List<SourceLocation> getSource() {
        return source;
    }

    /**
     * Gets the key of the message.
     *
     * @return The key of the message.
     */
    public List<String> getKey() {
        return key;
    }

    /**
     * Gets the details of the message.
     *
     * @return The details of the message.
     */
    public Object getDetails() {
        return details;
    }

    /**
     * Gets the channel of the message.
     *
     * @return The channel of the message.
     */
    public MessageChannel getChannel() {
        return channel;
    }

    /**
     * Gets the text of the message.
     *
     * @return The text of the message.
     */
    public String getText() {
        return text;
    }

    /**
     * Sets the channel of the message.
     *
     * @param channel The channel of the message.
     */
    public void setChannel(MessageChannel channel) {
        this.channel = channel;
    }

    /**
     * Sets the details of the message.
     *
     * @param details The details of the message.
     */
    public void setDetails(Object details) {
        this.details = details;
    }

    /**
     * Sets the key of the message.
     *
     * @param key The key of the message.
     */
    public void setKey(List<String> key) {
        this.key = key;
    }

    /**
     * Sets the source location of the message.
     *
     * @param source The source location of the message.
     */
    public void setSource(List<SourceLocation> source) {
        this.source = source;
    }

    /**
     * Sets the text of the message.
     *
     * @param text The text of the message.
     */
    public void setText(String text) {
        this.text = text;
    }
}
