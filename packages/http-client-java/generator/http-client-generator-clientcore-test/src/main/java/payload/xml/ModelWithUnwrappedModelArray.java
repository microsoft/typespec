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
 * §4.2 — Contains an unwrapped array of models.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithUnwrappedModelArray implements XmlSerializable<ModelWithUnwrappedModelArray> {
    /*
     * The items property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<SimpleModel> items;

    /**
     * Creates an instance of ModelWithUnwrappedModelArray class.
     * 
     * @param items the items value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithUnwrappedModelArray(List<SimpleModel> items) {
        this.items = items;
    }

    /**
     * Get the items property: The items property.
     * 
     * @return the items value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<SimpleModel> getItems() {
        return this.items;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithUnwrappedModelArray" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        if (this.items != null) {
            for (SimpleModel element : this.items) {
                xmlWriter.writeXml(element, "items");
            }
        }
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithUnwrappedModelArray from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithUnwrappedModelArray if the XmlReader was pointing to an instance of it, or null
     * if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithUnwrappedModelArray.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithUnwrappedModelArray fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithUnwrappedModelArray from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithUnwrappedModelArray if the XmlReader was pointing to an instance of it, or null
     * if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithUnwrappedModelArray.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithUnwrappedModelArray fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithUnwrappedModelArray" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            List<SimpleModel> items = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("items".equals(elementName.getLocalPart())) {
                    if (items == null) {
                        items = new ArrayList<>();
                    }
                    items.add(SimpleModel.fromXml(reader, "items"));
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithUnwrappedModelArray(items);
        });
    }
}
