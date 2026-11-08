// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelPropertySegment;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.api.parallel.ResourceLock;

@Isolated
@ResourceLock("ClientModels")
public class ConvenienceMethodTemplateBaseTests {

    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @Test
    public void validatesOnlyParametersPresentInHistoricalOverload() {
        new MockUnitJavagen() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                return "client-side-validations".equals(key) ? (T) Boolean.TRUE : super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
        ClientMethodParameter retained = new ClientMethodParameter.Builder().name("existing")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .build();
        ClientMethodParameter added = new ClientMethodParameter.Builder().name("body")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .build();
        ClientMethod full = new ClientMethod.Builder().name("operation")
            .type(ClientMethodType.SimpleSyncRestResponse)
            .parameters(List.of(retained, added))
            .requiredNullableParameterExpressions(List.of())
            .validateExpressions(Map.of("body", "body.validate()", "existing", "existing.validate()",
                "this.client.getOptions()", "this.client.getOptions().validate()"))
            .build();
        for (boolean historical : List.of(false, true)) {
            ClientMethod method = historical
                ? full.newBuilder().parameters(List.of(retained)).overloadedClientMethod(full).build()
                : full;
            JavaFileContents contents = new JavaFileContents();

            ClientMethodTemplate.addValidations(new JavaBlock(contents), method, JavaSettings.getInstance());

            String output = contents.toString();
            Assertions.assertEquals(!historical, output.contains("body.validate()"), output);
            Assertions.assertTrue(output.contains("existing.validate()"), output);
            Assertions.assertTrue(output.contains("this.client.getOptions().validate()"), output);
        }
    }

    @Test
    public void reservesParametersOmittedByVersioning() {
        ClientMethodParameter added = new ClientMethodParameter.Builder().name("nextLink")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .build();
        ClientMethodParameter retained = new ClientMethodParameter.Builder().name("nextLink1")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .build();
        ClientMethod full = new ClientMethod.Builder().name("list")
            .type(ClientMethodType.PagingAsync)
            .parameters(List.of(added, retained))
            .build();
        ClientMethod historical = full.newBuilder().parameters(List.of(retained)).overloadedClientMethod(full).build();

        Assertions.assertEquals("nextLink2", ClientMethodTemplateBase.availablePagingVariableName("nextLink",
            ClientMethodTemplateBase.pagingVariableNames(historical)));
    }

    @Test
    public void doesNotInitializeUnusedVersionedParametersInDelegatingMethods() {
        ClientMethodParameter required = new ClientMethodParameter.Builder().name("name")
            .wireType(ClassType.STRING)
            .required(true)
            .annotations(List.of())
            .build();
        ClientMethodParameter retained = new ClientMethodParameter.Builder().name("existing")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .build();
        ClientMethodParameter added = new ClientMethodParameter.Builder().name("newHeader")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .build();
        ClientMethod full = new ClientMethod.Builder().name("operation")
            .type(ClientMethodType.SimpleSync)
            .parameters(List.of(required, retained, added))
            .returnValue(new ReturnValue("The result.", ClassType.STRING))
            .methodVisibility(JavaVisibility.Public)
            .build();
        ClientMethod historical
            = full.newBuilder().parameters(List.of(required, retained)).overloadedClientMethod(full).build();
        JavaFileContents contents = new JavaFileContents();

        ClientMethodTemplate.getInstance()
            .generateSyncMethod(historical, new JavaClass(contents), JavaSettings.getInstance());

        Assertions.assertFalse(contents.toString().contains("final String newHeader"), contents.toString());
        Assertions.assertTrue(contents.toString().contains("operationAsync(name, existing)"), contents.toString());

        JavaFileContents minimumOverload = new JavaFileContents();
        ClientMethodTemplate.addOptionalVariables(new JavaBlock(minimumOverload),
            full.newBuilder().onlyRequiredParameters(true).build());
        Assertions.assertTrue(minimumOverload.toString().contains("final String existing = null;"));
        Assertions.assertTrue(minimumOverload.toString().contains("final String newHeader = null;"));
    }

    @Test
    public void initializesOnlyVersionedParametersReferencedByNextPage() {
        ClientMethodParameter addedHeader = new ClientMethodParameter.Builder().name("newHeader")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .build();
        ClientMethodParameter addedQuery = new ClientMethodParameter.Builder().name("nextLink")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .build();
        ClientMethodParameter nextLink = new ClientMethodParameter.Builder().name("nextLink")
            .wireType(ClassType.STRING)
            .required(true)
            .annotations(List.of())
            .build();
        for (boolean sync : List.of(false, true)) {
            for (boolean forwardHeader : List.of(false, true)) {
                ClientMethod next = new ClientMethod.Builder().name("listNext")
                    .parameters(forwardHeader ? List.of(nextLink, addedHeader) : List.of(nextLink))
                    .proxyMethod(new ProxyMethod.Builder().name("listNext").build())
                    .build();
                ClientMethod full = new ClientMethod.Builder().name("list")
                    .type(sync ? ClientMethodType.PagingSync : ClientMethodType.PagingAsync)
                    .parameters(List.of(addedHeader, addedQuery))
                    .proxyMethod(
                        new ProxyMethod.Builder().name("list").parameters(List.of()).allParameters(List.of()).build())
                    .returnValue(new ReturnValue("The items.",
                        sync ? GenericType.pagedIterable(ClassType.STRING) : GenericType.pagedFlux(ClassType.STRING)))
                    .methodVisibility(JavaVisibility.Public)
                    .methodPageDetails(new MethodPageDetails(List.of(),
                        List.of(new ModelPropertySegment(null,
                            new ClientModelProperty.Builder().name("nextLink")
                                .serializedName("nextLink")
                                .wireType(ClassType.STRING)
                                .clientType(ClassType.STRING)
                                .build())),
                        next, null, null, null, null))
                    .build();
                ClientMethod historical = full.newBuilder().parameters(List.of()).overloadedClientMethod(full).build();
                JavaFileContents contents = new JavaFileContents();
                if (sync) {
                    ClientMethodTemplate.getInstance()
                        .generatePagingPlainSync(historical, new JavaClass(contents), JavaSettings.getInstance());
                } else {
                    ClientMethodTemplate.getInstance()
                        .generatePagingAsync(historical, new JavaClass(contents), JavaSettings.getInstance());
                }

                String output = contents.toString();
                Assertions.assertEquals(forwardHeader, output.contains("final String newHeader = null;"), output);
                Assertions.assertFalse(output.contains("final String nextLink = null;"), output);
                Assertions.assertTrue(output.contains("listNextSinglePage"), output);
            }
        }
    }

    @Test
    public void unwrapsMonoResponse() {
        IType leaf = ClassType.STRING;
        IType returnType = GenericType.mono(GenericType.response(leaf));

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(leaf, result);
    }

    @Test
    public void unwrapsPagedFlux() {
        IType leaf = ClassType.BINARY_DATA;
        IType returnType = GenericType.pagedFlux(leaf);

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(leaf, result);
    }

    @Test
    public void unwrapsResponseBaseSecondTypeArgument() {
        IType leaf = ClassType.INTEGER;
        IType returnType = GenericType.restResponse(ClassType.BINARY_DATA, leaf);

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(leaf, result);
    }

    @Test
    public void unwrapsNestedMonoPagedResponseBase() {
        IType leaf = ArrayType.BYTE_ARRAY;
        IType pagedResponseBase = new GenericType(ClassType.PAGED_RESPONSE_BASE.getPackage(),
            ClassType.PAGED_RESPONSE_BASE.getName(), ClassType.STRING, leaf);
        IType returnType = GenericType.mono(pagedResponseBase);

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(leaf, result);
    }

    @Test
    public void keepsNonGenericTypeUnchanged() {
        IType returnType = ClassType.BASE_64_URL;

        IType result = ConvenienceMethodTemplateBase.getConvenienceResponseBodyType(methodWithReturnType(returnType));

        Assertions.assertSame(returnType, result);
    }

    @Test
    public void binaryDataResponsesIgnoreContentType() {
        for (String contentType : List.of("text/plain", "application/json", "application/xml",
            "application/octet-stream")) {
            Assertions.assertEquals("return readWithResponse(requestOptions).getValue();",
                renderConversion(false, ClassType.BINARY_DATA, ClassType.STRING, contentType));
            Assertions.assertEquals("return readWithResponse(requestOptions).flatMap(FluxUtil::toMono);",
                renderConversion(true, ClassType.BINARY_DATA, ClassType.STRING, contentType));
        }
    }

    @Test
    public void textBytesResponsesUseRawBytes() {
        Assertions.assertEquals("return readWithResponse(requestOptions).getValue().toBytes();",
            renderConversion(false, ArrayType.BYTE_ARRAY, ArrayType.BYTE_ARRAY, "text/plain"));
        Assertions.assertEquals(
            "return readWithResponse(requestOptions).flatMap(FluxUtil::toMono).map(protocolMethodData -> protocolMethodData.toBytes());",
            renderConversion(true, ArrayType.BYTE_ARRAY, ArrayType.BYTE_ARRAY, "text/plain"));
    }

    @Test
    public void textStringsKeepTextConversion() {
        Assertions.assertEquals("return readWithResponse(requestOptions).getValue().toString();",
            renderConversion(false, ClassType.STRING, ClassType.STRING, "text/plain"));
        Assertions.assertEquals(
            "return readWithResponse(requestOptions).flatMap(FluxUtil::toMono).map(protocolMethodData -> protocolMethodData.toString());",
            renderConversion(true, ClassType.STRING, ClassType.STRING, "text/plain"));
    }

    @Test
    public void jsonBytesKeepDeserialization() {
        Assertions.assertEquals("return readWithResponse(requestOptions).getValue().toObject(byte[].class);",
            renderConversion(false, ArrayType.BYTE_ARRAY, ArrayType.BYTE_ARRAY, "application/json"));
        Assertions.assertEquals(
            "return readWithResponse(requestOptions).flatMap(FluxUtil::toMono).map(protocolMethodData -> protocolMethodData.toObject(byte[].class));",
            renderConversion(true, ArrayType.BYTE_ARRAY, ArrayType.BYTE_ARRAY, "application/json"));
    }

    @Test
    public void optionalMultipartTextFieldsPreserveNull() {
        for (IType type : List.of(ClassType.BOOLEAN, ClassType.INTEGER, ClassType.LONG, ClassType.DOUBLE)) {
            String getter = type == ClassType.BOOLEAN ? "isValue" : "getValue";
            Assertions.assertTrue(renderMultipartConversion(type, false)
                .contains(".serializeTextField(\"value\", Objects.toString(body." + getter + "(), null))"));
        }
    }

    @Test
    public void requiredNullableMultipartTextFieldsKeepNullText() {
        for (IType type : List.of(ClassType.BOOLEAN, ClassType.INTEGER, ClassType.LONG, ClassType.DOUBLE)) {
            String getter = type == ClassType.BOOLEAN ? "isValue" : "getValue";
            Assertions.assertTrue(renderMultipartConversion(type, true)
                .contains(".serializeTextField(\"value\", Objects.toString(body." + getter + "()))"));
        }
    }

    @Test
    public void requiredMultipartPrimitivesKeepStringConversion() {
        for (IType type : List.of(PrimitiveType.BOOLEAN, PrimitiveType.INT, PrimitiveType.LONG, PrimitiveType.DOUBLE)) {
            String getter = type == PrimitiveType.BOOLEAN ? "isValue" : "getValue";
            Assertions.assertTrue(renderMultipartConversion(type, true)
                .contains(".serializeTextField(\"value\", String.valueOf(body." + getter + "()))"));
        }
    }

    @Test
    public void multipartStringsKeepDirectSerialization() {
        Assertions.assertTrue(renderMultipartConversion(ClassType.STRING, false)
            .contains(".serializeTextField(\"value\", body.getValue())"));
    }

    private static String renderMultipartConversion(IType type, boolean required) {
        ClientModel model = new ClientModel.Builder().name("Multipart" + type + required)
            .serializationFormats(Set.of("multipart"))
            .properties(List.of(new ClientModelProperty.Builder().name("value")
                .serializedName("value")
                .wireType(type)
                .clientType(type)
                .required(required)
                .build()))
            .build();
        ClientModels.getInstance().addModel(model);
        ClassType modelType = new ClassType.Builder().name(model.getName()).build();
        ProxyMethodParameter proxyParameter = new ProxyMethodParameter.Builder().name("body")
            .requestParameterName("body")
            .requestParameterLocation(RequestParameterLocation.BODY)
            .rawType(modelType)
            .wireType(ClassType.BINARY_DATA)
            .clientType(ClassType.BINARY_DATA)
            .build();
        ProxyMethod proxyMethod = new ProxyMethod.Builder().name("upload")
            .parameters(List.of(proxyParameter))
            .allParameters(List.of(proxyParameter))
            .requestContentType("multipart/form-data")
            .responseBodyType(ClassType.BINARY_DATA)
            .rawResponseBodyType(ClassType.VOID)
            .build();
        ClientMethodParameter body = new ClientMethodParameter.Builder().name("body")
            .annotations(List.of())
            .requestParameterLocation(RequestParameterLocation.BODY)
            .wireType(modelType)
            .required(true)
            .build();
        ClientMethodParameter protocolBody = new ClientMethodParameter.Builder().name("body")
            .annotations(List.of())
            .requestParameterLocation(RequestParameterLocation.BODY)
            .wireType(ClassType.BINARY_DATA)
            .required(true)
            .build();
        ClientMethod protocolMethod = new ClientMethod.Builder().name("uploadWithResponse")
            .parameters(List.of(protocolBody))
            .proxyMethod(proxyMethod)
            .type(ClientMethodType.SimpleSyncRestResponse)
            .returnValue(new ReturnValue("response", GenericType.response(ClassType.BINARY_DATA)))
            .build();
        ClientMethod convenienceMethod = new ClientMethod.Builder().name("upload")
            .parameters(List.of(body))
            .parameterTransformations(new ParameterTransformations(List.of()))
            .proxyMethod(proxyMethod)
            .type(ClientMethodType.SimpleSync)
            .returnValue(new ReturnValue("response", ClassType.VOID))
            .build();
        JavaFileContents contents = new JavaFileContents();
        ConvenienceSyncMethodTemplate.getInstance()
            .writeMethodImplementation(protocolMethod, convenienceMethod, new JavaBlock(contents), new HashSet<>());
        return contents.toString();
    }

    private static String renderConversion(boolean async, IType responseBodyType, IType rawType, String contentType) {
        ProxyMethod proxyMethod = new ProxyMethod.Builder().name("read")
            .responseBodyType(ClassType.BINARY_DATA)
            .rawResponseBodyType(rawType)
            .responseContentTypes(Set.of(contentType))
            .build();
        IType protocolReturnType = GenericType.response(ClassType.BINARY_DATA);
        ClientMethod protocolMethod = new ClientMethod.Builder().name("readWithResponse")
            .parameters(List.of())
            .proxyMethod(proxyMethod)
            .type(async ? ClientMethodType.SimpleAsyncRestResponse : ClientMethodType.SimpleSyncRestResponse)
            .returnValue(new ReturnValue("response", async ? GenericType.mono(protocolReturnType) : protocolReturnType))
            .build();
        ClientMethod convenienceMethod = new ClientMethod.Builder().name("read")
            .parameters(List.of())
            .proxyMethod(proxyMethod)
            .type(async ? ClientMethodType.SimpleAsync : ClientMethodType.SimpleSync)
            .returnValue(new ReturnValue("response", async ? GenericType.mono(responseBodyType) : responseBodyType))
            .build();
        JavaFileContents contents = new JavaFileContents();
        ConvenienceMethodTemplateBase template
            = async ? ConvenienceAsyncMethodTemplate.getInstance() : ConvenienceSyncMethodTemplate.getInstance();
        template.writeInvocationAndConversion(convenienceMethod, protocolMethod, "requestOptions",
            new JavaBlock(contents), new HashSet<>());
        return contents.toString().trim();
    }

    private static ClientMethod methodWithReturnType(IType returnType) {
        return new ClientMethod.Builder().name("test")
            .description("test")
            .parameters(List.of())
            .returnValue(new ReturnValue("test", returnType))
            .build();
    }
}
