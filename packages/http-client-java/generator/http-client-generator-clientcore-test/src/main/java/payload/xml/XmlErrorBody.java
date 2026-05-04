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
 * The body of an XML error response.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class XmlErrorBody implements XmlSerializable<XmlErrorBody> {
    /*
     * The message property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String message;

    /*
     * The code property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final int code;

    /**
     * Creates an instance of XmlErrorBody class.
     * 
     * @param message the message value to set.
     * @param code the code value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private XmlErrorBody(String message, int code) {
        this.message = message;
        this.code = code;
    }

    /**
     * Get the message property: The message property.
     * 
     * @return the message value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getMessage() {
        return this.message;
    }

    /**
     * Get the code property: The code property.
     * 
     * @return the code value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getCode() {
        return this.code;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty() ? "XmlErrorBody" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeStringElement("message", this.message);
        xmlWriter.writeIntElement("code", this.code);
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of XmlErrorBody from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of XmlErrorBody if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the XmlErrorBody.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static XmlErrorBody fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of XmlErrorBody from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of XmlErrorBody if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the XmlErrorBody.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static XmlErrorBody fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "XmlErrorBody" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            String message = null;
            int code = 0;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("message".equals(elementName.getLocalPart())) {
                    message = reader.getStringElement();
                } else if ("code".equals(elementName.getLocalPart())) {
                    code = reader.getIntElement();
                } else {
                    reader.skipElement();
                }
            }
            return new XmlErrorBody(message, code);
        });
    }
}
