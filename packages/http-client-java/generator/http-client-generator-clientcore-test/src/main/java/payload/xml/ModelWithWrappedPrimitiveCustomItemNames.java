package payload.xml;

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

/**
 * §3.5 — Contains a wrapped primitive array with custom wrapper and item names.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithWrappedPrimitiveCustomItemNames
    implements XmlSerializable<ModelWithWrappedPrimitiveCustomItemNames> {
    /*
     * The ItemsTags property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<String> tags;

    /**
     * Creates an instance of ModelWithWrappedPrimitiveCustomItemNames class.
     * 
     * @param tags the tags value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithWrappedPrimitiveCustomItemNames(List<String> tags) {
        this.tags = tags;
    }

    /**
     * Get the tags property: The ItemsTags property.
     * 
     * @return the tags value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<String> getTags() {
        return this.tags;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty()
            ? "ModelWithWrappedPrimitiveCustomItemNames"
            : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        if (this.tags != null) {
            xmlWriter.writeStartElement("ItemsTags");
            for (String element : this.tags) {
                xmlWriter.writeStringElement("ItemName", element);
            }
            xmlWriter.writeEndElement();
        }
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithWrappedPrimitiveCustomItemNames from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithWrappedPrimitiveCustomItemNames if the XmlReader was pointing to an instance of
     * it, or null if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithWrappedPrimitiveCustomItemNames.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithWrappedPrimitiveCustomItemNames fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithWrappedPrimitiveCustomItemNames from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithWrappedPrimitiveCustomItemNames if the XmlReader was pointing to an instance of
     * it, or null if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithWrappedPrimitiveCustomItemNames.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithWrappedPrimitiveCustomItemNames fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName = rootElementName == null || rootElementName.isEmpty()
            ? "ModelWithWrappedPrimitiveCustomItemNames"
            : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            List<String> tags = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("ItemsTags".equals(elementName.getLocalPart())) {
                    while (reader.nextElement() != XmlToken.END_ELEMENT) {
                        elementName = reader.getElementName();
                        if ("ItemName".equals(elementName.getLocalPart())) {
                            if (tags == null) {
                                tags = new ArrayList<>();
                            }
                            tags.add(reader.getStringElement());
                        } else {
                            reader.skipElement();
                        }
                    }
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithWrappedPrimitiveCustomItemNames(tags);
        });
    }
}
