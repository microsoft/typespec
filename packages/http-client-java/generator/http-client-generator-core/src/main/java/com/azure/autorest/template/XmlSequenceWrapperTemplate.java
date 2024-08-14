// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.template;

import com.azure.autorest.extension.base.plugin.JavaSettings;
import com.azure.autorest.model.clientmodel.ClassType;
import com.azure.autorest.model.clientmodel.IType;
import com.azure.autorest.model.clientmodel.XmlSequenceWrapper;
import com.azure.autorest.model.javamodel.JavaClass;
import com.azure.autorest.model.javamodel.JavaFile;
import com.azure.autorest.util.CodeNamer;
import com.azure.xml.XmlReader;
import com.azure.xml.XmlSerializable;
import com.azure.xml.XmlToken;
import com.azure.xml.XmlWriter;

import javax.xml.namespace.QName;
import javax.xml.stream.XMLStreamException;
import java.util.ArrayList;

/**
 * Writes an XmlSequenceWrapper to a JavaFile.
 */
public class XmlSequenceWrapperTemplate implements IJavaTemplate<XmlSequenceWrapper, JavaFile> {
    private static final XmlSequenceWrapperTemplate INSTANCE = new XmlSequenceWrapperTemplate();

    private XmlSequenceWrapperTemplate() {
    }

    public static XmlSequenceWrapperTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(XmlSequenceWrapper xmlSequenceWrapper, JavaFile javaFile) {
        JavaSettings settings = JavaSettings.getInstance();

        String xmlRootElementName = xmlSequenceWrapper.getXmlRootElementName();
        String xmlListElementName = xmlSequenceWrapper.getXmlListElementName();

        String xmlElementNameCamelCase = CodeNamer.toCamelCase(xmlRootElementName);

        IType sequenceType = xmlSequenceWrapper.getSequenceType();

        javaFile.declareImport(xmlSequenceWrapper.getImports());

        if (settings.isStreamStyleSerialization()) {
            javaFile.declareImport(ArrayList.class.getName(), ClassType.CORE_UTILS.getFullName(), QName.class.getName(),
                XmlReader.class.getName(), XmlSerializable.class.getName(), XMLStreamException.class.getName(),
                XmlToken.class.getName(), XmlWriter.class.getName());
        }

        javaFile.javadocComment(comment -> comment.description(
            "A wrapper around " + sequenceType + " which provides top-level metadata for serialization."));

        String className = xmlSequenceWrapper.getWrapperClassName();
        if (!settings.isStreamStyleSerialization()) {
            javaFile.annotation("JacksonXmlRootElement(localName = \"" + xmlRootElementName + "\")");
        } else {
            className = className + " implements XmlSerializable<" + className + ">";
        }
        javaFile.publicFinalClass(className, classBlock -> {
            if (settings.isStreamStyleSerialization()) {
                writeStreamStyleXmlWrapper(classBlock, xmlSequenceWrapper, xmlRootElementName, xmlListElementName,
                    xmlElementNameCamelCase, sequenceType);
            } else {
                writeJacksonXmlWrapper(classBlock, xmlSequenceWrapper, xmlListElementName, xmlElementNameCamelCase,
                    sequenceType);
            }
        });
    }

    private static void writeJacksonXmlWrapper(JavaClass classBlock, XmlSequenceWrapper xmlSequenceWrapper,
        String xmlListElementName, String xmlElementNameCamelCase, IType sequenceType) {
        classBlock.annotation("JacksonXmlProperty(localName = \"" + xmlListElementName + "\")");
        classBlock.privateFinalMemberVariable(sequenceType.toString(), xmlElementNameCamelCase);

        classBlock.javadocComment(comment -> {
            comment.description("Creates an instance of " + xmlSequenceWrapper.getWrapperClassName() + ".");
            comment.param(xmlElementNameCamelCase, "the list");
        });
        classBlock.annotation("JsonCreator");
        classBlock.publicConstructor(String.format("%1$s(@JsonProperty(\"%2$s\") %3$s %4$s)",
                xmlSequenceWrapper.getWrapperClassName(), xmlListElementName, sequenceType, xmlElementNameCamelCase),
            constructor -> constructor.line("this." + xmlElementNameCamelCase + " = " + xmlElementNameCamelCase + ";"));

        addGetter(classBlock, sequenceType, xmlElementNameCamelCase);
    }

    private static void addGetter(JavaClass classBlock, IType sequenceType, String xmlElementNameCamelCase) {
        classBlock.javadocComment(comment -> {
            comment.description("Get the " + sequenceType + " contained in this wrapper.");
            comment.methodReturns("the " + sequenceType);
        });
        classBlock.publicMethod(sequenceType + " items()", function -> function.methodReturn(xmlElementNameCamelCase));
    }

    private static void writeStreamStyleXmlWrapper(JavaClass classBlock, XmlSequenceWrapper xmlSequenceWrapper,
        String xmlRootElementName, String xmlListElementName, String xmlElementNameCamelCase, IType sequenceType) {
        classBlock.privateFinalMemberVariable(sequenceType.toString(), xmlElementNameCamelCase);

        classBlock.javadocComment(comment -> {
            comment.description("Creates an instance of " + xmlSequenceWrapper.getWrapperClassName() + ".");
            comment.param(xmlElementNameCamelCase, "the list");
        });
        classBlock.publicConstructor(String.format("%s(%s %s)", xmlSequenceWrapper.getWrapperClassName(), sequenceType,
                xmlElementNameCamelCase),
            constructor -> constructor.line("this." + xmlElementNameCamelCase + " = " + xmlElementNameCamelCase + ";"));

        addGetter(classBlock, sequenceType, xmlElementNameCamelCase);

        StreamSerializationModelTemplate.xmlWrapperClassXmlSerializableImplementation(classBlock,
            xmlSequenceWrapper.getWrapperClassName(), sequenceType, xmlRootElementName,
            xmlSequenceWrapper.getXmlRootElementNamespace(), xmlListElementName,
            xmlElementNameCamelCase, xmlSequenceWrapper.getXmlListElementNamespace(),
            Templates.getModelTemplate()::addGeneratedAnnotation);
    }
}
