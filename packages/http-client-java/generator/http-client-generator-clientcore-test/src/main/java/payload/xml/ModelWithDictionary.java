package payload.xml;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.xml.XmlReader;
import io.clientcore.core.serialization.xml.XmlSerializable;
import io.clientcore.core.serialization.xml.XmlToken;
import io.clientcore.core.serialization.xml.XmlWriter;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.xml.namespace.QName;
import javax.xml.stream.XMLStreamException;

/**
 * Contains a dictionary of key value pairs.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithDictionary implements XmlSerializable<ModelWithDictionary> {

    /*
     * The metadata property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final Map<String, String> metadata;

    /**
     * Creates an instance of ModelWithDictionary class.
     *
     * @param metadata the metadata value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithDictionary(Map<String, String> metadata) {
        this.metadata = metadata;
    }

    /**
     * Get the metadata property: The metadata property.
     *
     * @return the metadata value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Map<String, String> getMetadata() {
        return this.metadata;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithDictionary" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        if (this.metadata != null) {
            xmlWriter.writeStartElement("metadata");
            for (Map.Entry<String, String> entry : this.metadata.entrySet()) {
                xmlWriter.writeStringElement(entry.getKey(), entry.getValue());
            }
            xmlWriter.writeEndElement();
        }
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithDictionary from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithDictionary if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithDictionary.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithDictionary fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithDictionary from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithDictionary if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithDictionary.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithDictionary fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithDictionary" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            Map<String, String> metadata = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();
                if ("metadata".equals(elementName.getLocalPart())) {
                    while (reader.nextElement() != XmlToken.END_ELEMENT) {
                        if (metadata == null) {
                            metadata = new LinkedHashMap<>();
                        }
                        metadata.put(reader.getElementName().getLocalPart(), reader.getStringElement());
                    }
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithDictionary(metadata);
        });
    }
}
