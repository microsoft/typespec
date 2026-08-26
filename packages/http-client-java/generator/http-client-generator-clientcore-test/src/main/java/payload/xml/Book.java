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
 * Book model with a custom XML name.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Book implements XmlSerializable<Book> {
    /*
     * The title property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String title;

    /**
     * Creates an instance of Book class.
     * 
     * @param title the title value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Book(String title) {
        this.title = title;
    }

    /**
     * Get the title property: The title property.
     * 
     * @return the title value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getTitle() {
        return this.title;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty() ? "XmlBook" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeStringElement("title", this.title);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of Book from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of Book if the XmlReader was pointing to an instance of it, or null if it was pointing to XML
     * null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the Book.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Book fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of Book from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of Book if the XmlReader was pointing to an instance of it, or null if it was pointing to XML
     * null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the Book.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Book fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "XmlBook" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            String title = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("title".equals(elementName.getLocalPart())) {
                    title = reader.getStringElement();
                } else {
                    reader.skipElement();
                }
            }
            return new Book(title);
        });
    }
}
