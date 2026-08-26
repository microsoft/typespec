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
 * §6.2, §7.2 — Contains fields with different XML namespaces on individual properties.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithNamespaceOnProperties implements XmlSerializable<ModelWithNamespaceOnProperties> {
    private static final String EXAMPLE_COM__SCHEMA = "http://example.com/schema";

    private static final String EXAMPLE_COM__NS2 = "http://example.com/ns2";

    /*
     * The id property.
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
     * Creates an instance of ModelWithNamespaceOnProperties class.
     * 
     * @param id the id value to set.
     * @param title the title value to set.
     * @param author the author value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithNamespaceOnProperties(int id, String title, String author) {
        this.id = id;
        this.title = title;
        this.author = author;
    }

    /**
     * Get the id property: The id property.
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithNamespaceOnProperties" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeNamespace(EXAMPLE_COM__SCHEMA);
        xmlWriter.writeNamespace("smp", EXAMPLE_COM__SCHEMA);
        xmlWriter.writeNamespace("ns2", EXAMPLE_COM__NS2);
        xmlWriter.writeIntElement("id", this.id);
        xmlWriter.writeStringElement(EXAMPLE_COM__SCHEMA, "title", this.title);
        xmlWriter.writeStringElement(EXAMPLE_COM__NS2, "author", this.author);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithNamespaceOnProperties from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithNamespaceOnProperties if the XmlReader was pointing to an instance of it, or null
     * if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithNamespaceOnProperties.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithNamespaceOnProperties fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithNamespaceOnProperties from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithNamespaceOnProperties if the XmlReader was pointing to an instance of it, or null
     * if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithNamespaceOnProperties.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithNamespaceOnProperties fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithNamespaceOnProperties" : rootElementName;
        return xmlReader.readObject(EXAMPLE_COM__SCHEMA, finalRootElementName, reader -> {
            int id = 0;
            String title = null;
            String author = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("id".equals(elementName.getLocalPart())) {
                    id = reader.getIntElement();
                } else if ("title".equals(elementName.getLocalPart())
                    && EXAMPLE_COM__SCHEMA.equals(elementName.getNamespaceURI())) {
                    title = reader.getStringElement();
                } else if ("author".equals(elementName.getLocalPart())
                    && EXAMPLE_COM__NS2.equals(elementName.getNamespaceURI())) {
                    author = reader.getStringElement();
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithNamespaceOnProperties(id, title, author);
        });
    }
}
