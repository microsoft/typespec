// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents individual serialization formats.
 */
public class SerializationFormats {
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
}
