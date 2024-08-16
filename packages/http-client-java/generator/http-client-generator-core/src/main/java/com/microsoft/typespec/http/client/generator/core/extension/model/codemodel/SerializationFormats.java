// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.Objects;

/**
 * Represents individual serialization formats.
 */
public class SerializationFormats implements JsonSerializable<SerializationFormats> {
    private SerializationFormat json;
    private XmlSerializationFormat xml;
    private SerializationFormat protobuf;

    /**
     * Creates a new instance of the SerializationFormats class.
     */
    public SerializationFormats() {
    }

    /**
     * Gets the JSON serialization format.
     *
     * @return The JSON serialization format.
     */
    public SerializationFormat getJson() {
        return json;
    }

    /**
     * Sets the JSON serialization format.
     *
     * @param json The JSON serialization format.
     */
    public void setJson(SerializationFormat json) {
        this.json = json;
    }

    /**
     * Gets the XML serialization format.
     *
     * @return The XML serialization format.
     */
    public XmlSerializationFormat getXml() {
        return xml;
    }

    /**
     * Sets the XML serialization format.
     *
     * @param xml The XML serialization format.
     */
    public void setXml(XmlSerializationFormat xml) {
        this.xml = xml;
    }

    /**
     * Gets the Protobuf serialization format.
     *
     * @return The Protobuf serialization format.
     */
    public SerializationFormat getProtobuf() {
        return protobuf;
    }

    /**
     * Sets the Protobuf serialization format.
     *
     * @param protobuf The Protobuf serialization format.
     */
    public void setProtobuf(SerializationFormat protobuf) {
        this.protobuf = protobuf;
    }

    @Override
    public String toString() {
        return SerializationFormats.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this))
            + "[json=" + Objects.toString(json, "<null>") + ",xml=" + Objects.toString(xml, "<null>") + ",protobuf="
            + Objects.toString(protobuf, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(json, protobuf, xml);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof SerializationFormats)) {
            return false;
        }

        SerializationFormats rhs = ((SerializationFormats) other);
        return Objects.equals(json, rhs.json) && Objects.equals(protobuf, rhs.protobuf) && Objects.equals(xml, rhs.xml);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("json", json)
            .writeJsonField("xml", xml)
            .writeJsonField("protobuf", protobuf)
            .writeEndObject();
    }

    /**
     * Deserializes a SerializationFormats instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A SerializationFormats instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static SerializationFormats fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, SerializationFormats::new, (formats, fieldName, reader) -> {
            if ("json".equals(fieldName)) {
                formats.json = SerializationFormat.fromJson(reader);
            } else if ("xml".equals(fieldName)) {
                formats.xml = XmlSerializationFormat.fromJson(reader);
            } else if ("protobuf".equals(fieldName)) {
                formats.protobuf = SerializationFormat.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
