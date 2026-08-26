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
 * §2.2 — Contains a property whose type has.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithRenamedNestedModel implements XmlSerializable<ModelWithRenamedNestedModel> {
    /*
     * The author property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final Author author;

    /**
     * Creates an instance of ModelWithRenamedNestedModel class.
     * 
     * @param author the author value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithRenamedNestedModel(Author author) {
        this.author = author;
    }

    /**
     * Get the author property: The author property.
     * 
     * @return the author value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Author getAuthor() {
        return this.author;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedNestedModel" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeXml(this.author, "author");
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithRenamedNestedModel from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithRenamedNestedModel if the XmlReader was pointing to an instance of it, or null if
     * it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedNestedModel.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedNestedModel fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithRenamedNestedModel from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithRenamedNestedModel if the XmlReader was pointing to an instance of it, or null if
     * it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedNestedModel.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedNestedModel fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedNestedModel" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            Author author = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("author".equals(elementName.getLocalPart())) {
                    author = Author.fromXml(reader, "author");
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithRenamedNestedModel(author);
        });
    }
}
