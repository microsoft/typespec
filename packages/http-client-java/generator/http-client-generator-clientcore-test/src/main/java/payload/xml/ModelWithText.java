package payload.xml;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.xml.XmlReader;
import io.clientcore.core.serialization.xml.XmlSerializable;
import io.clientcore.core.serialization.xml.XmlWriter;
import javax.xml.stream.XMLStreamException;

/**
 * Contains an attribute and text.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithText implements XmlSerializable<ModelWithText> {

    /*
     * The language property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String language;

    /*
     * The content property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String content;

    /**
     * Creates an instance of ModelWithText class.
     *
     * @param language the language value to set.
     * @param content the content value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithText(String language, String content) {
        this.language = language;
        this.content = content;
    }

    /**
     * Get the language property: The language property.
     *
     * @return the language value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getLanguage() {
        return this.language;
    }

    /**
     * Get the content property: The content property.
     *
     * @return the content value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getContent() {
        return this.content;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty() ? "ModelWithText" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeStringAttribute("language", this.language);
        xmlWriter.writeString(this.content);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithText from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithText if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithText.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithText fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithText from the XmlReader.
     *
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithText if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithText.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithText fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithText" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            String language = reader.getStringAttribute(null, "language");
            String content = reader.getStringElement();
            return new ModelWithText(language, content);
        });
    }
}
