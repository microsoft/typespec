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
 * §4.5 — Contains a wrapped array of models with custom wrapper and item names.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithRenamedWrappedAndItemModelArray
    implements XmlSerializable<ModelWithRenamedWrappedAndItemModelArray> {
    /*
     * The AllBooks property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<Book> books;

    /**
     * Creates an instance of ModelWithRenamedWrappedAndItemModelArray class.
     * 
     * @param books the books value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithRenamedWrappedAndItemModelArray(List<Book> books) {
        this.books = books;
    }

    /**
     * Get the books property: The AllBooks property.
     * 
     * @return the books value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<Book> getBooks() {
        return this.books;
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
            ? "ModelWithRenamedWrappedAndItemModelArray"
            : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        if (this.books != null) {
            xmlWriter.writeStartElement("AllBooks");
            for (Book element : this.books) {
                xmlWriter.writeXml(element, "XmlBook");
            }
            xmlWriter.writeEndElement();
        }
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithRenamedWrappedAndItemModelArray from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithRenamedWrappedAndItemModelArray if the XmlReader was pointing to an instance of
     * it, or null if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedWrappedAndItemModelArray.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedWrappedAndItemModelArray fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithRenamedWrappedAndItemModelArray from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithRenamedWrappedAndItemModelArray if the XmlReader was pointing to an instance of
     * it, or null if it was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedWrappedAndItemModelArray.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedWrappedAndItemModelArray fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName = rootElementName == null || rootElementName.isEmpty()
            ? "ModelWithRenamedWrappedAndItemModelArray"
            : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            List<Book> books = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("AllBooks".equals(elementName.getLocalPart())) {
                    while (reader.nextElement() != XmlToken.END_ELEMENT) {
                        elementName = reader.getElementName();
                        if ("XmlBook".equals(elementName.getLocalPart())) {
                            if (books == null) {
                                books = new ArrayList<>();
                            }
                            books.add(Book.fromXml(reader, "XmlBook"));
                        } else {
                            reader.skipElement();
                        }
                    }
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithRenamedWrappedAndItemModelArray(books);
        });
    }
}
