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
 * Contains fields of wrapped and unwrapped arrays of primitive types.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithUnwrappedArray implements XmlSerializable<ModelWithUnwrappedArray> {

    /*
     * The colors property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<String> colors;

    /*
     * The counts property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<Integer> counts;

    /**
     * Creates an instance of ModelWithUnwrappedArray class.
     *
     * @param colors the colors value to set.
     * @param counts the counts value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithUnwrappedArray(List<String> colors, List<Integer> counts) {
        this.colors = colors;
        this.counts = counts;
    }

    /**
     * Get the colors property: The colors property.
     *
     * @return the colors value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<String> getColors() {
        return this.colors;
    }

    /**
     * Get the counts property: The counts property.
     *
     * @return the counts value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<Integer> getCounts() {
        return this.counts;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithUnwrappedArray" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        if (this.colors != null) {
            for (String element : this.colors) {
                xmlWriter.writeStringElement("colors", element);
            }
        }
        if (this.counts != null) {
            xmlWriter.writeStartElement("counts");
            for (int element : this.counts) {
                xmlWriter.writeIntElement("int32", element);
            }
            xmlWriter.writeEndElement();
        }
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithUnwrappedArray from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithUnwrappedArray if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithUnwrappedArray.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithUnwrappedArray fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithUnwrappedArray from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithUnwrappedArray if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithUnwrappedArray.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithUnwrappedArray fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithUnwrappedArray" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            List<String> colors = null;
            List<Integer> counts = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();
                if ("colors".equals(elementName.getLocalPart())) {
                    if (colors == null) {
                        colors = new ArrayList<>();
                    }
                    colors.add(reader.getStringElement());
                } else if ("counts".equals(elementName.getLocalPart())) {
                    while (reader.nextElement() != XmlToken.END_ELEMENT) {
                        elementName = reader.getElementName();
                        if ("int32".equals(elementName.getLocalPart())) {
                            if (counts == null) {
                                counts = new ArrayList<>();
                            }
                            counts.add(reader.getIntElement());
                        } else {
                            reader.skipElement();
                        }
                    }
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithUnwrappedArray(colors, counts);
        });
    }
}
