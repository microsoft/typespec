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
 * §1.2 — Contains a scalar property with a custom XML name.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithRenamedProperty implements XmlSerializable<ModelWithRenamedProperty> {
    /*
     * The renamedTitle property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String title;

    /*
     * The author property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String author;

    /**
     * Creates an instance of ModelWithRenamedProperty class.
     * 
     * @param title the title value to set.
     * @param author the author value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithRenamedProperty(String title, String author) {
        this.title = title;
        this.author = author;
    }

    /**
     * Get the title property: The renamedTitle property.
     * 
     * @return the title value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getTitle() {
        return this.title;
    }

    /**
     * Get the author property: The author property.
     * 
     * @return the author value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getAuthor() {
        return this.author;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedProperty" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeStringElement("renamedTitle", this.title);
        xmlWriter.writeStringElement("author", this.author);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithRenamedProperty from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithRenamedProperty if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedProperty fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithRenamedProperty from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithRenamedProperty if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedProperty fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedProperty" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            String title = null;
            String author = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("renamedTitle".equals(elementName.getLocalPart())) {
                    title = reader.getStringElement();
                } else if ("author".equals(elementName.getLocalPart())) {
                    author = reader.getStringElement();
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithRenamedProperty(title, author);
        });
    }
}
