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
 * Contains fields of wrapped and unwrapped arrays of primitive types that have different XML representations.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithRenamedArrays implements XmlSerializable<ModelWithRenamedArrays> {
    /*
     * The Colors property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<String> colors;

    /*
     * The Counts property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<Integer> counts;

    /**
     * Creates an instance of ModelWithRenamedArrays class.
     * 
     * @param colors the colors value to set.
     * @param counts the counts value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithRenamedArrays(List<String> colors, List<Integer> counts) {
        this.colors = colors;
        this.counts = counts;
    }

    /**
     * Get the colors property: The Colors property.
     * 
     * @return the colors value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<String> getColors() {
        return this.colors;
    }

    /**
     * Get the counts property: The Counts property.
     * 
     * @return the counts value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<Integer> getCounts() {
        if (this.counts == null) {
            return Collections.emptyList();
        }
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedArrays" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        if (this.counts != null) {
            xmlWriter.writeStartElement("Counts");
            for (int element : this.counts) {
                xmlWriter.writeIntElement("int32", element);
            }
            xmlWriter.writeEndElement();
        }
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithRenamedArrays from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithRenamedArrays if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedArrays.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedArrays fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithRenamedArrays from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithRenamedArrays if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedArrays.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedArrays fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedArrays" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            List<Integer> counts = null;
            List<String> colors = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("Counts".equals(elementName.getLocalPart())) {
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
            return new ModelWithRenamedArrays(colors, counts);
        });
    }
}
