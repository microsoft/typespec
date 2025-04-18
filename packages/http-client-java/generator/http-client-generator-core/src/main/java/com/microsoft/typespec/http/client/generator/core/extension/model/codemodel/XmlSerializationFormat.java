// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

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
        return Objects.equals(name, rhs.name)
            && Objects.equals(namespace, rhs.namespace)
            && attribute == rhs.attribute
            && wrapped == rhs.wrapped
            && Objects.equals(prefix, rhs.prefix)
            && text == rhs.text;
    }
}
