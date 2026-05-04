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
 * §5.2 — Contains a renamed XML attribute.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithRenamedAttribute implements XmlSerializable<ModelWithRenamedAttribute> {
    /*
     * The xml-id property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final int id;

    /*
     * The title property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String title;

    /*
     * The author property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String author;

    /**
     * Creates an instance of ModelWithRenamedAttribute class.
     * 
     * @param id the id value to set.
     * @param title the title value to set.
     * @param author the author value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithRenamedAttribute(int id, String title, String author) {
        this.id = id;
        this.title = title;
        this.author = author;
    }

    /**
     * Get the id property: The xml-id property.
     * 
     * @return the id value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getId() {
        return this.id;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedAttribute" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeIntAttribute("xml-id", this.id);
        xmlWriter.writeStringElement("title", this.title);
        xmlWriter.writeStringElement("author", this.author);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithRenamedAttribute from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithRenamedAttribute if the XmlReader was pointing to an instance of it, or null if
     * it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedAttribute.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedAttribute fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithRenamedAttribute from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithRenamedAttribute if the XmlReader was pointing to an instance of it, or null if
     * it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedAttribute.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedAttribute fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedAttribute" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            String title = null;
            String author = null;
            int id = reader.getIntAttribute(null, "xml-id");
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("title".equals(elementName.getLocalPart())) {
                    title = reader.getStringElement();
                } else if ("author".equals(elementName.getLocalPart())) {
                    author = reader.getStringElement();
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithRenamedAttribute(id, title, author);
        });
    }
}
