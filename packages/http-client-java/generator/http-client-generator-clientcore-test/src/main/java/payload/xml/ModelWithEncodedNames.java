package payload.xml;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.xml.XmlReader;
import io.clientcore.core.serialization.xml.XmlSerializable;
import io.clientcore.core.serialization.xml.XmlToken;
import io.clientcore.core.serialization.xml.XmlWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.xml.namespace.QName;
import javax.xml.stream.XMLStreamException;

/**
 * Uses encodedName instead of Xml.Name which is functionally equivalent.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithEncodedNames implements XmlSerializable<ModelWithEncodedNames> {
    /*
     * The SimpleModelData property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final SimpleModel modelData;

    /*
     * The PossibleColors property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<String> colors;

    /**
     * Creates an instance of ModelWithEncodedNames class.
     * 
     * @param modelData the modelData value to set.
     * @param colors the colors value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithEncodedNames(SimpleModel modelData, List<String> colors) {
        this.modelData = modelData;
        this.colors = colors;
    }

    /**
     * Get the modelData property: The SimpleModelData property.
     * 
     * @return the modelData value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SimpleModel getModelData() {
        return this.modelData;
    }

    /**
     * Get the colors property: The PossibleColors property.
     * 
     * @return the colors value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<String> getColors() {
        if (this.colors == null) {
            return Collections.emptyList();
        }
        return this.colors;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithEncodedNamesSrc" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeXml(this.modelData, "SimpleModelData");
        if (this.colors != null) {
            xmlWriter.writeStartElement("PossibleColors");
            for (String element : this.colors) {
                xmlWriter.writeStringElement("string", element);
            }
            xmlWriter.writeEndElement();
        }
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithEncodedNames from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithEncodedNames if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithEncodedNames.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithEncodedNames fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithEncodedNames from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithEncodedNames if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithEncodedNames.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithEncodedNames fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithEncodedNamesSrc" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            SimpleModel modelData = null;
            List<String> colors = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("SimpleModelData".equals(elementName.getLocalPart())) {
                    modelData = SimpleModel.fromXml(reader, "SimpleModelData");
                } else if ("PossibleColors".equals(elementName.getLocalPart())) {
                    while (reader.nextElement() != XmlToken.END_ELEMENT) {
                        elementName = reader.getElementName();
                        if ("string".equals(elementName.getLocalPart())) {
                            if (colors == null) {
                                colors = new ArrayList<>();
                            }
                            colors.add(reader.getStringElement());
                        } else {
                            reader.skipElement();
                        }
                    }
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithEncodedNames(modelData, colors);
        });
    }
}
