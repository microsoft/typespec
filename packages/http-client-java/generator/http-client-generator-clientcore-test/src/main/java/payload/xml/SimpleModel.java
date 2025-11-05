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
 * Contains fields of primitive types.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class SimpleModel implements XmlSerializable<SimpleModel> {

    /*
     * The name property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String name;

    /*
     * The age property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final int age;

    /**
     * Creates an instance of SimpleModel class.
     *
     * @param name the name value to set.
     * @param age the age value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SimpleModel(String name, int age) {
        this.name = name;
        this.age = age;
    }

    /**
     * Get the name property: The name property.
     *
     * @return the name value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getName() {
        return this.name;
    }

    /**
     * Get the age property: The age property.
     *
     * @return the age value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getAge() {
        return this.age;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty() ? "SimpleModel" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeStringElement("name", this.name);
        xmlWriter.writeIntElement("age", this.age);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of SimpleModel from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @return An instance of SimpleModel if the XmlReader was pointing to an instance of it, or null if it was pointing
     * to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the SimpleModel.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static SimpleModel fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of SimpleModel from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of SimpleModel if the XmlReader was pointing to an instance of it, or null if it was pointing
     * to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the SimpleModel.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static SimpleModel fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "SimpleModel" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            String name = null;
            int age = 0;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();
                if ("name".equals(elementName.getLocalPart())) {
                    name = reader.getStringElement();
                } else if ("age".equals(elementName.getLocalPart())) {
                    age = reader.getIntElement();
                } else {
                    reader.skipElement();
                }
            }
            return new SimpleModel(name, age);
        });
    }
}
