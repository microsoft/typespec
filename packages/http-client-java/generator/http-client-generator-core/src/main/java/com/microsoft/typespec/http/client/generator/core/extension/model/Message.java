// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model;

import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

/**
 * Represents a message.
 */
public class Message implements JsonSerializable<Message> {

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

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("Channel", channel == null ? null : channel.toString())
            .writeUntypedField("Details", details)
            .writeStringField("Text", text)
            .writeArrayField("Key", key, JsonWriter::writeString)
            .writeArrayField("Source", source, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a Message instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Message instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Message fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            Message message = new Message();

            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("Channel".equals(fieldName)) {
                    message.channel = MessageChannel.valueOf(reader.getString());
                } else if ("Details".equals(fieldName)) {
                    message.details = reader.readUntyped();
                } else if ("Text".equals(fieldName)) {
                    message.text = reader.getString();
                } else if ("Key".equals(fieldName)) {
                    message.key = reader.readArray(JsonReader::getString);
                } else if ("Source".equals(fieldName)) {
                    message.source = reader.readArray(SourceLocation::fromJson);
                } else {
                    reader.skipChildren();
                }
            }

            return message;
        });
    }
}
