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
 * §2.1 — Contains a property that references another model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithNestedModel implements XmlSerializable<ModelWithNestedModel> {
    /*
     * The nested property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final SimpleModel nested;

    /**
     * Creates an instance of ModelWithNestedModel class.
     * 
     * @param nested the nested value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithNestedModel(SimpleModel nested) {
        this.nested = nested;
    }

    /**
     * Get the nested property: The nested property.
     * 
     * @return the nested value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SimpleModel getNested() {
        return this.nested;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithNestedModel" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeXml(this.nested, "nested");
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithNestedModel from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithNestedModel if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithNestedModel.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithNestedModel fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithNestedModel from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithNestedModel if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithNestedModel.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithNestedModel fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithNestedModel" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            SimpleModel nested = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("nested".equals(elementName.getLocalPart())) {
                    nested = SimpleModel.fromXml(reader, "nested");
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithNestedModel(nested);
        });
    }
}
