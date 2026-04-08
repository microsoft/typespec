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
 * Contains a single property with an enum value.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithEnum implements XmlSerializable<ModelWithEnum> {
    /*
     * The status property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final Status status;

    /**
     * Creates an instance of ModelWithEnum class.
     * 
     * @param status the status value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithEnum(Status status) {
        this.status = status;
    }

    /**
     * Get the status property: The status property.
     * 
     * @return the status value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Status getStatus() {
        return this.status;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty() ? "ModelWithEnum" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeStringElement("status", this.status == null ? null : this.status.getValue());
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithEnum from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithEnum if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithEnum.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithEnum fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithEnum from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithEnum if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithEnum.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithEnum fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithEnum" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            Status status = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("status".equals(elementName.getLocalPart())) {
                    status = Status.fromValue(reader.getStringElement());
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithEnum(status);
        });
    }
}
