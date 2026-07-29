package payload.pageable.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.xml.XmlReader;
import io.clientcore.core.serialization.xml.XmlSerializable;
import io.clientcore.core.serialization.xml.XmlToken;
import io.clientcore.core.serialization.xml.XmlWriter;
import java.util.ArrayList;
import java.util.List;
import javax.xml.namespace.QName;
import javax.xml.stream.XMLStreamException;
import payload.pageable.XmlPet;

/**
 * The XML response for listing pets with next link.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class XmlPetListResultWithNextLink implements XmlSerializable<XmlPetListResultWithNextLink> {
    /*
     * The Pets property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<XmlPet> pets;

    /*
     * The NextLink property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String nextLink;

    /**
     * Creates an instance of XmlPetListResultWithNextLink class.
     * 
     * @param pets the pets value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private XmlPetListResultWithNextLink(List<XmlPet> pets) {
        this.pets = pets;
    }

    /**
     * Get the pets property: The Pets property.
     * 
     * @return the pets value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<XmlPet> getPets() {
        return this.pets;
    }

    /**
     * Get the nextLink property: The NextLink property.
     * 
     * @return the nextLink value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getNextLink() {
        return this.nextLink;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty() ? "PetListResult" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        if (this.pets != null) {
            xmlWriter.writeStartElement("Pets");
            for (XmlPet element : this.pets) {
                xmlWriter.writeXml(element, "Pet");
            }
            xmlWriter.writeEndElement();
        }
        xmlWriter.writeStringElement("NextLink", this.nextLink);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of XmlPetListResultWithNextLink from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of XmlPetListResultWithNextLink if the XmlReader was pointing to an instance of it, or null
     * if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the XmlPetListResultWithNextLink.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static XmlPetListResultWithNextLink fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of XmlPetListResultWithNextLink from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of XmlPetListResultWithNextLink if the XmlReader was pointing to an instance of it, or null
     * if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the XmlPetListResultWithNextLink.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static XmlPetListResultWithNextLink fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "PetListResult" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            List<XmlPet> pets = null;
            String nextLink = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("Pets".equals(elementName.getLocalPart())) {
                    while (reader.nextElement() != XmlToken.END_ELEMENT) {
                        elementName = reader.getElementName();
                        if ("Pet".equals(elementName.getLocalPart())) {
                            if (pets == null) {
                                pets = new ArrayList<>();
                            }
                            pets.add(XmlPet.fromXml(reader, "Pet"));
                        } else {
                            reader.skipElement();
                        }
                    }
                } else if ("NextLink".equals(elementName.getLocalPart())) {
                    nextLink = reader.getStringElement();
                } else {
                    reader.skipElement();
                }
            }
            XmlPetListResultWithNextLink deserializedXmlPetListResultWithNextLink
                = new XmlPetListResultWithNextLink(pets);
            deserializedXmlPetListResultWithNextLink.nextLink = nextLink;

            return deserializedXmlPetListResultWithNextLink;
        });
    }
}
