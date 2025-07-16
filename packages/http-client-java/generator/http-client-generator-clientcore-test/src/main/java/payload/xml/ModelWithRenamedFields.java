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
 * Contains fields of the same type that have different XML representation.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithRenamedFields implements XmlSerializable<ModelWithRenamedFields> {
    /*
     * The InputData property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final SimpleModel inputData;

    /*
     * The OutputData property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final SimpleModel outputData;

    /**
     * Creates an instance of ModelWithRenamedFields class.
     * 
     * @param inputData the inputData value to set.
     * @param outputData the outputData value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithRenamedFields(SimpleModel inputData, SimpleModel outputData) {
        this.inputData = inputData;
        this.outputData = outputData;
    }

    /**
     * Get the inputData property: The InputData property.
     * 
     * @return the inputData value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SimpleModel getInputData() {
        return this.inputData;
    }

    /**
     * Get the outputData property: The OutputData property.
     * 
     * @return the outputData value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SimpleModel getOutputData() {
        return this.outputData;
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
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedFieldsSrc" : rootElementName;
        xmlWriter.writeStartElement(rootElementName);
        xmlWriter.writeXml(this.inputData, "InputData");
        xmlWriter.writeXml(this.outputData, "OutputData");
        return xmlWriter.writeEndElement();
    }

    /**
     * Reads an instance of ModelWithRenamedFields from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @return An instance of ModelWithRenamedFields if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedFields.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedFields fromXml(XmlReader xmlReader) throws XMLStreamException {
        return fromXml(xmlReader, null);
    }

    /**
     * Reads an instance of ModelWithRenamedFields from the XmlReader.
     * 
     * @param xmlReader The XmlReader being read.
     * @param rootElementName Optional root element name to override the default defined by the model. Used to support
     * cases where the model can deserialize from different root element names.
     * @return An instance of ModelWithRenamedFields if the XmlReader was pointing to an instance of it, or null if it
     * was pointing to XML null.
     * @throws IllegalStateException If the deserialized XML object was missing any required properties.
     * @throws XMLStreamException If an error occurs while reading the ModelWithRenamedFields.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithRenamedFields fromXml(XmlReader xmlReader, String rootElementName)
        throws XMLStreamException {
        String finalRootElementName
            = rootElementName == null || rootElementName.isEmpty() ? "ModelWithRenamedFieldsSrc" : rootElementName;
        return xmlReader.readObject(finalRootElementName, reader -> {
            SimpleModel inputData = null;
            SimpleModel outputData = null;
            while (reader.nextElement() != XmlToken.END_ELEMENT) {
                QName elementName = reader.getElementName();

                if ("InputData".equals(elementName.getLocalPart())) {
                    inputData = SimpleModel.fromXml(reader, "InputData");
                } else if ("OutputData".equals(elementName.getLocalPart())) {
                    outputData = SimpleModel.fromXml(reader, "OutputData");
                } else {
                    reader.skipElement();
                }
            }
            return new ModelWithRenamedFields(inputData, outputData);
        });
    }
}
