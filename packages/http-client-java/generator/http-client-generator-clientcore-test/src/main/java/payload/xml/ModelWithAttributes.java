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
 * Contains fields that are XML attributes.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithAttributes implements XmlSerializable<ModelWithAttributes> {

    /*
     * The id1 property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final int id1;

    /*
     * The id2 property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String id2;

    /*
     * The enabled property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final boolean enabled;

    /**
     * Creates an instance of ModelWithAttributes class.
     *
     * @param id1 the id1 value to set.
     * @param id2 the id2 value to set.
     * @param enabled the enabled value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithAttributes(int id1, String id2, boolean enabled) {
        this.id1 = id1;
        this.id2 = id2;
        this.enabled = enabled;
    }

    /**
     * Get the id1 property: The id1 property.
     *
     * @return the id1 value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getId1() {
        return this.id1;
    }

    /**
     * Get the id2 property: The id2 property.
     *
     * @return the id2 value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getId2() {
        return this.id2;
    }

    /**
     * Get the enabled property: The enabled property.
     *
     * @return the enabled value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public boolean isEnabled() {
        return this.enabled;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithAttributes" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeIntAttribute("id1", this.id1);
        xmlWriter.writeStringAttribute("id2", this.id2);
        xmlWriter.writeBooleanElement("enabled", this.enabled);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithAttributes from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithAttributes if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithAttributes.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithAttributes fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithAttributes from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithAttributes if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithAttributes.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithAttributes fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithAttributes" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            boolean enabled = false;
            int id1 = reader.getIntAttribute(null, "id1");
            String id2 = reader.getStringAttribute(null, "id2");
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();
                if ("enabled".equals(elementName.getLocalPart())) {
                    enabled = reader.getBooleanElement();
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithAttributes(id1, id2, enabled);
        });
    }
}
