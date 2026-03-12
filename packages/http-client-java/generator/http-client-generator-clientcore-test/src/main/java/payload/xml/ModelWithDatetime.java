package payload.xml;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.xml.XmlReader;
import io.clientcore.core.serialization.xml.XmlSerializable;
import io.clientcore.core.serialization.xml.XmlToken;
import io.clientcore.core.serialization.xml.XmlWriter;
import io.clientcore.core.utils.DateTimeRfc1123;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import javax.xml.namespace.QName;
import javax.xml.stream.XMLStreamException;

/**
 * Contains datetime properties with different encodings.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithDatetime implements XmlSerializable<ModelWithDatetime> {
    /*
     * DateTime value with rfc3339 encoding.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final OffsetDateTime rfc3339;

    /*
     * DateTime value with rfc7231 encoding.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final DateTimeRfc1123 rfc7231;

    /**
     * Creates an instance of ModelWithDatetime class.
     * 
     * @param rfc3339 the rfc3339 value to set.
     * @param rfc7231 the rfc7231 value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithDatetime(OffsetDateTime rfc3339, OffsetDateTime rfc7231) {
        this.rfc3339 = rfc3339;
        if (rfc7231 == null) {
            this.rfc7231 = null;
        } else {
            this.rfc7231 = new DateTimeRfc1123(rfc7231);
        }
    }

    /**
     * Get the rfc3339 property: DateTime value with rfc3339 encoding.
     * 
     * @return the rfc3339 value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OffsetDateTime getRfc3339() {
        return this.rfc3339;
    }

    /**
     * Get the rfc7231 property: DateTime value with rfc7231 encoding.
     * 
     * @return the rfc7231 value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OffsetDateTime getRfc7231() {
        if (this.rfc7231 == null) {
            return null;
        }
        return this.rfc7231.getDateTime();
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter) throws XMLStreamException {
        return toXml(xmlWriter, null);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlWriter toXml(XmlWriter xmlWriter, String rootElementName) throws XMLStreamException {
        rootElementName = rootElementName == null || rootElementName.isEmpty() ? "ModelWithDatetime" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeStringElement("rfc3339",
            this.rfc3339 == null ? null : DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(this.rfc3339));
        xmlWriter.writeStringElement("rfc7231", Objects.toString(this.rfc7231, null));
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithDatetime from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithDatetime if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithDatetime.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithDatetime fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithDatetime from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithDatetime if the XmlReader was pointing to an instance of it, or null if it was
     * pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithDatetime.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithDatetime fromXml(XmlReader xmlReader, String rootElementName) throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithDatetime" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            OffsetDateTime rfc3339 = null;
            OffsetDateTime rfc7231 = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("rfc3339".equals(elementName.getLocalPart())) {
                    rfc3339 = reader.getNullableElement(dateString -> OffsetDateTime.parse(dateString));
                } else if ("rfc7231".equals(elementName.getLocalPart())) {
                    DateTimeRfc1123 rfc7231Holder = reader.getNullableElement(DateTimeRfc1123::new);
                    if (rfc7231Holder != null) {
                        rfc7231 = rfc7231Holder.getDateTime();
                    }
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithDatetime(rfc3339, rfc7231);
        });
    }
}
