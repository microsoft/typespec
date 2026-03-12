package payload.pageable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.xml.XmlReader;
import io.clientcore.core.serialization.xml.XmlSerializable;
import io.clientcore.core.serialization.xml.XmlToken;
import io.clientcore.core.serialization.xml.XmlWriter;
import javax.xml.namespace.QName;
import javax.xml.stream.XMLStreamException;

/**
 * An XML pet item.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class XmlPet implements XmlSerializable<XmlPet> {
    /*
     * The Id property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String id;

    /*
     * The Name property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String name;

    /**
     * Creates an instance of XmlPet class.
     * 
     * @param id the id value to set.
     * @param name the name value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private XmlPet(String id, String name) {
        this.id = id;
        this.name = name;
    }

    /**
     * Get the id property: The Id property.
     * 
     * @return the id value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getId() {
        return this.id;
    }

    /**
     * Get the name property: The Name property.
     * 
     * @return the name value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getName() {
        return this.name;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty() ? "Pet" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeStringElement("Id", this.id);
        xmlWriter.writeStringElement("Name", this.name);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of XmlPet from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of XmlPet if the XmlReader was pointing to an instance of it, or null if it was pointing to
     * XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the XmlPet.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static XmlPet fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of XmlPet from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of XmlPet if the XmlReader was pointing to an instance of it, or null if it was pointing to
     * XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the XmlPet.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static XmlPet fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName = rootElementName == null || rootElementName.isEmpty() ? "Pet" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            String id = null;
            String name = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("Id".equals(elementName.getLocalPart())) {
                    id = reader.getStringElement();
                } else if ("Name".equals(elementName.getLocalPart())) {
                    name = reader.getStringElement();
                } else {
                    reader.skipElement();
                }
            }
            return new XmlPet(id, name);
        });
    }
}
