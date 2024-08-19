// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.Objects;

/**
 * Represents the XML serialization format.
 */
public class XmlSerializationFormat extends SerializationFormat {
    private String name;
    private String namespace;
    private String prefix;
    private boolean attribute;
    private boolean wrapped;
    private boolean text;

    /**
     * Creates a new instance of the XmlSerializationFormat class.
     */
    public XmlSerializationFormat() {
    }

    /**
     * Gets the name of the XML element.
     *
     * @return The name of the XML element.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the name of the XML element.
     *
     * @param name The name of the XML element.
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the namespace of the XML element.
     *
     * @return The namespace of the XML element.
     */
    public String getNamespace() {
        return namespace;
    }

    /**
     * Sets the namespace of the XML element.
     *
     * @param namespace The namespace of the XML element.
     */
    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    /**
     * Gets the prefix of the XML element.
     *
     * @return The prefix of the XML element.
     */
    public String getPrefix() {
        return prefix;
    }

    /**
     * Sets the prefix of the XML element.
     *
     * @param prefix The prefix of the XML element.
     */
    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    /**
     * Gets whether the XML element is an attribute.
     *
     * @return Whether the XML element is an attribute.
     */
    public boolean isAttribute() {
        return attribute;
    }

    /**
     * Sets whether the XML element is an attribute.
     *
     * @param attribute Whether the XML element is an attribute.
     */
    public void setAttribute(boolean attribute) {
        this.attribute = attribute;
    }

    /**
     * Gets whether the XML element is wrapped.
     *
     * @return Whether the XML element is wrapped.
     */
    public boolean isWrapped() {
        return wrapped;
    }

    /**
     * Sets whether the XML element is wrapped.
     *
     * @param wrapped Whether the XML element is wrapped.
     */
    public void setWrapped(boolean wrapped) {
        this.wrapped = wrapped;
    }

    /**
     * Gets whether the XML element is text.
     *
     * @return Whether the XML element is text.
     */
    public boolean isText() {
        return text;
    }

    /**
     * Sets whether the XML element is text.
     *
     * @param text Whether the XML element is text.
     */
    public void setText(boolean text) {
        this.text = text;
    }

    @Override
    public String toString() {
        return XmlSerializationFormat.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this))
            + "[name=" + Objects.toString(name, "<null>") + ",namespace=" + Objects.toString(namespace, "<null>")
            + ",prefix=" + Objects.toString(prefix, "<null>") + ",attribute=" + attribute + ",wrapped=" + wrapped
            + ",text=" + text + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, namespace, attribute, wrapped, prefix, text);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof XmlSerializationFormat)) {
            return false;
        }
        XmlSerializationFormat rhs = ((XmlSerializationFormat) other);
        return Objects.equals(name, rhs.name) && Objects.equals(namespace, rhs.namespace) && attribute == rhs.attribute
            && wrapped == rhs.wrapped && Objects.equals(prefix, rhs.prefix) && text == rhs.text;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("extensions", getExtensions())
            .writeStringField("name", name)
            .writeStringField("namespace", namespace)
            .writeStringField("prefix", prefix)
            .writeBooleanField("attribute", attribute)
            .writeBooleanField("wrapped", wrapped)
            .writeBooleanField("text", text)
            .writeEndObject();
    }

    /**
     * Deserializes a XmlSerializationFormat instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A XmlSerializationFormat instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static XmlSerializationFormat fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, XmlSerializationFormat::new, (format, fieldName, reader) -> {
            if ("extensions".equals(fieldName)) {
                format.setExtensions(DictionaryAny.fromJson(reader));
            } else if ("name".equals(fieldName)) {
                format.name = reader.getString();
            } else if ("namespace".equals(fieldName)) {
                format.namespace = reader.getString();
            } else if ("prefix".equals(fieldName)) {
                format.prefix = reader.getString();
            } else if ("attribute".equals(fieldName)) {
                format.attribute = reader.getBoolean();
            } else if ("wrapped".equals(fieldName)) {
                format.wrapped = reader.getBoolean();
            } else if ("text".equals(fieldName)) {
                format.text = reader.getBoolean();
            } else {
                reader.skipChildren();
            }
        });
    }
}
