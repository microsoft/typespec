// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.implementation.ClientModelPropertiesManager;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@Isolated
public class StreamSerializationModelTemplateTests {
    private enum Serialization {
        JSON, XML_ELEMENT, XML_ATTRIBUTE, XML_TEXT
    }

    @BeforeEach
    public void configureConstructorArguments() {
        new MockUnitJavagen() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                return "required-fields-as-ctor-args".equals(key) ? (T) Boolean.TRUE : super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
    }

    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @ParameterizedTest
    @CsvSource({
        "true,true,JSON,false",
        "true,false,JSON,false",
        "false,true,JSON,false",
        "false,false,JSON,false",
        "true,true,XML_ELEMENT,false",
        "true,false,XML_ELEMENT,false",
        "false,true,XML_ELEMENT,false",
        "false,false,XML_ELEMENT,false",
        "true,true,JSON,true",
        "true,false,JSON,true",
        "false,true,JSON,true",
        "false,false,JSON,true",
        "true,true,XML_ELEMENT,true",
        "true,false,XML_ELEMENT,true",
        "false,true,XML_ELEMENT,true",
        "false,false,XML_ELEMENT,true",
        "true,true,XML_ATTRIBUTE,false",
        "true,false,XML_ATTRIBUTE,false",
        "false,true,XML_ATTRIBUTE,false",
        "false,false,XML_ATTRIBUTE,false",
        "true,true,XML_TEXT,false",
        "true,false,XML_TEXT,false",
        "false,true,XML_TEXT,false",
        "false,false,XML_TEXT,false",
        "true,true,XML_ATTRIBUTE,true",
        "true,false,XML_ATTRIBUTE,true",
        "false,true,XML_ATTRIBUTE,true",
        "false,false,XML_ATTRIBUTE,true",
        "true,true,XML_TEXT,true",
        "true,false,XML_TEXT,true",
        "false,true,XML_TEXT,true",
        "false,false,XML_TEXT,true" })
    public void inheritedReadOnlyDatetimeUsesSetterOrShadowType(boolean samePackage, boolean required,
        Serialization serialization, boolean constructorArguments) {
        IType wireType = required ? PrimitiveType.UNIX_TIME_LONG : ClassType.UNIX_TIME_LONG;
        String generated
            = renderInheritedDatetime(samePackage, required, serialization, constructorArguments, wireType);
        if (serialization != Serialization.JSON) {
            Assertions.assertTrue(generated.contains("if (getCreatedAt() != null)"), generated);
            Assertions.assertFalse(generated.contains("getCreatedAt().toEpochSecond() != null"), generated);
        }
        if (serialization == Serialization.XML_TEXT) {
            Assertions.assertTrue(generated.contains(wireType.xmlSerializationMethodCall("xmlWriter", null, null,
                wireType.convertFromClientType("getCreatedAt()"), false, false, false) + ";"), generated);
        }
        String readExpression = serialization == Serialization.JSON
            ? wireType.jsonDeserializationMethod("reader")
            : wireType.xmlDeserializationMethod("reader",
                serialization == Serialization.XML_ATTRIBUTE ? "created_at" : null, null, false);
        if (samePackage) {
            String value = required ? readExpression : "createdAtHolder";
            String assignment = constructorArguments
                ? "createdAt = " + wireType.convertToClientType(value) + ";"
                : "deserializedDatetimeChild.setCreatedAt(" + wireType.convertToClientType(value) + ");";
            Assertions.assertTrue(generated.contains(assignment), generated);
            if (constructorArguments
                && (!required || serialization == Serialization.JSON || serialization == Serialization.XML_ELEMENT)) {
                Assertions.assertTrue(generated.contains("OffsetDateTime createdAt = null;"), generated);
            }
            if (!required) {
                Assertions.assertTrue(generated.contains("Long createdAtHolder = " + readExpression + ";"), generated);
                int guard = generated.indexOf("if (createdAtHolder != null)");
                int assignmentIndex = generated.indexOf(assignment);
                Assertions.assertTrue(
                    guard >= 0 && assignmentIndex > guard && assignmentIndex < generated.indexOf("}", guard),
                    generated);
            }
        } else {
            String target = constructorArguments ? "createdAt" : "deserializedDatetimeChild.createdAt";
            Assertions.assertTrue(generated.contains(target + " = " + readExpression + ";"), generated);
            Assertions.assertFalse(generated.contains("createdAtHolder"), generated);
            if (constructorArguments
                && (serialization == Serialization.JSON || serialization == Serialization.XML_ELEMENT)) {
                Assertions.assertTrue(
                    generated.contains(wireType + " createdAt = " + wireType.defaultValueExpression() + ";"),
                    generated);
            } else if (constructorArguments) {
                Assertions.assertTrue(generated.contains(wireType + " createdAt = " + readExpression + ";"), generated);
            }
        }
    }

    private static String renderInheritedDatetime(boolean samePackage, boolean required, Serialization serialization,
        boolean constructorArguments, IType wireType) {
        boolean xml = serialization != Serialization.JSON;
        String suffix = "" + samePackage + required + serialization + constructorArguments;
        ClientModelProperty discriminator = new ClientModelProperty.Builder().name("kind")
            .serializedName("kind")
            .xmlName("kind")
            .xmlAttribute(true)
            .wireType(ClassType.STRING)
            .clientType(ClassType.STRING)
            .required(true)
            .polymorphicDiscriminator(true)
            .constant(true)
            .defaultValue("\"specialized\"")
            .build();
        ClientModelProperty createdAt = new ClientModelProperty.Builder().name("createdAt")
            .serializedName("created_at")
            .xmlName("created_at")
            .xmlAttribute(serialization == Serialization.XML_ATTRIBUTE)
            .xmlText(serialization == Serialization.XML_TEXT)
            .wireType(wireType)
            .clientType(wireType.getClientType())
            .required(required)
            .readOnly(true)
            .build();
        ClientModel parent = new ClientModel.Builder().name("DatetimeParent" + suffix)
            .packageName("com.azure.mock.models")
            .polymorphic(true)
            .polymorphicDiscriminator(discriminator)
            .polymorphicDiscriminatorName("kind")
            .properties(List.of(discriminator, createdAt))
            .xmlName(xml ? "Job" : null)
            .build();
        ClientModels.getInstance().addModel(parent);
        ClientModelProperty name = new ClientModelProperty.Builder().name("name")
            .serializedName("name")
            .xmlName("name")
            .xmlAttribute(xml)
            .wireType(ClassType.STRING)
            .clientType(ClassType.STRING)
            .required(true)
            .build();
        ClientModel child = new ClientModel.Builder().name("DatetimeChild")
            .packageName(samePackage ? parent.getPackage() : "com.azure.mock.other")
            .parentModelName(parent.getName())
            .polymorphic(true)
            .polymorphicDiscriminator(discriminator)
            .polymorphicDiscriminatorName("kind")
            .serializedName("specialized")
            .properties(constructorArguments ? List.of(discriminator, name) : List.of(discriminator))
            .xmlName(xml ? "Job" : null)
            .build();
        JavaFile file = new JavaFile("DatetimeChild.java");
        ClientModelPropertiesManager properties = new ClientModelPropertiesManager(child, JavaSettings.getInstance());
        file.publicFinalClass("DatetimeChild", classBlock -> StreamSerializationModelTemplate.getInstance()
            .writeStreamStyleSerialization(classBlock, properties));
        return file.getContents().toString();
    }
}
