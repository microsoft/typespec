package payload.xml;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.xml.XmlReader;
import io.clientcore.core.serialization.xml.XmlSerializable;
import io.clientcore.core.serialization.xml.XmlToken;
import io.clientcore.core.serialization.xml.XmlWriter;
import javax.xml.namespace.QName;
import javax.xml.stream.XMLStreamException;

/**
 * Contains an optional field.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class ModelWithOptionalField implements XmlSerializable<ModelWithOptionalField> {

    /*
     * The item property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String item;

    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Integer value;

    /**
     * Creates an instance of ModelWithOptionalField class.
     *
     * @param item the item value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithOptionalField(String item) {
        this.item = item;
    }

    /**
     * Get the item property: The item property.
     *
     * @return the item value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getItem() {
        return this.item;
    }

    /**
     * Get the value property: The value property.
     *
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Integer getValue() {
        return this.value;
    }

    /**
     * Set the value property: The value property.
     *
     * @param value the value value to set.
     * @return the ModelWithOptionalField object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithOptionalField setValue(Integer value) {
        this.value = value;
        return this;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithOptionalField" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeStringElement("item", this.item);
        xmlWriter.writeNumberElement("value", this.value);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithOptionalField from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithOptionalField if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithOptionalField.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithOptionalField fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithOptionalField from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithOptionalField if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithOptionalField.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithOptionalField fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithOptionalField" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            String item = null;
            Integer value = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();
                if ("item".equals(elementName.getLocalPart())) {
                    item = reader.getStringElement();
                } else if ("value".equals(elementName.getLocalPart())) {
                    value = reader.getNullableElement(Integer::parseInt);
                } else {
                    reader.skipElement();
                }
            }
            ModelWithOptionalField deserializedModelWithOptionalField = new ModelWithOptionalField(item);
            deserializedModelWithOptionalField.value = value;
            return deserializedModelWithOptionalField;
        });
    }
}
