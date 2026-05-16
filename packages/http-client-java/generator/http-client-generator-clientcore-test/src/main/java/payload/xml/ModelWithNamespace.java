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
 * §6.1, §7.1 — Contains fields with XML namespace on the model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithNamespace implements XmlSerializable<ModelWithNamespace> {
    private static final String EXAMPLE_COM__SCHEMA = "http://example.com/schema";

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

    /**
     * Creates an instance of ModelWithNamespace class.
     * 
     * @param id the id value to set.
     * @param title the title value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithNamespace(int id, String title) {
        this.id = id;
        this.title = title;
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

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty() ? "ModelWithNamespace" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeNamespace(EXAMPLE_COM__SCHEMA);
        xmlWriter.writeIntElement("id", this.id);
        xmlWriter.writeStringElement("title", this.title);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithNamespace from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithNamespace if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithNamespace.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithNamespace fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithNamespace from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithNamespace if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithNamespace.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithNamespace fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithNamespace" : rootElementName;
        return xmlReader.readObject(EXAMPLE_COM__SCHEMA, finalRootElementName, reader -> {
            int id = 0;
            String title = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("id".equals(elementName.getLocalPart())) {
                    id = reader.getIntElement();
                } else if ("title".equals(elementName.getLocalPart())) {
                    title = reader.getStringElement();
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithNamespace(id, title);
        });
    }
}
