// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantValue;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Header;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import java.util.ArrayList;
import java.util.Arrays;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ClientMapperConstantHeaderTests {

    @Test
    public void testConstantHeadersAreFiltered() {
        // Create an operation with both constant and non-constant headers
        Operation operation = createOperationWithMixedHeaders();

        // Get the mapper instance
        ClientMapper mapper = ClientMapper.getInstance();

        // Parse headers
        ObjectSchema headerSchema = mapper.parseHeader(operation, JavaSettings.getInstance());

        // Verify that only the non-constant header is included
        Assertions.assertNotNull(headerSchema, "Header schema should not be null");
        Assertions.assertEquals(1, headerSchema.getProperties().size(),
            "Should have exactly 1 property (constant headers filtered out)");

        // Verify the remaining property is the non-constant header
        Assertions.assertEquals("x-variable-header", headerSchema.getProperties().get(0).getSerializedName(),
            "The remaining header should be the non-constant one");
    }

    @Test
    public void testAllConstantHeadersFiltered() {
        // Create an operation with only constant headers
        Operation operation = createOperationWithOnlyConstantHeaders();

        // Get the mapper instance
        ClientMapper mapper = ClientMapper.getInstance();

        // Parse headers
        ObjectSchema headerSchema = mapper.parseHeader(operation, JavaSettings.getInstance());

        // Verify that no header schema is created when all headers are constant
        Assertions.assertNull(headerSchema, "Header schema should be null when all headers are constant");
    }

    private Operation createOperationWithMixedHeaders() {
        Operation operation = new Operation();

        // Set up operation group
        OperationGroup operationGroup = new OperationGroup();
        Languages opGroupLanguages = new Languages();
        Language opGroupJava = new Language();
        opGroupJava.setName("TestOps");
        opGroupLanguages.setJava(opGroupJava);
        operationGroup.setLanguage(opGroupLanguages);
        operation.setOperationGroup(operationGroup);

        // Set up operation language
        Languages opLanguages = new Languages();
        Language opJava = new Language();
        opJava.setName("getResource");
        opLanguages.setJava(opJava);
        operation.setLanguage(opLanguages);

        // Create response with headers
        Response response = new Response();
        Protocols protocols = new Protocols();
        Protocol httpProtocol = new Protocol();

        // Create headers list
        ArrayList<Header> headers = new ArrayList<>();

        // Add constant header (content-type)
        Header constantHeader1 = new Header();
        constantHeader1.setHeader("content-type");
        ConstantSchema constantSchema1 = new ConstantSchema();
        ConstantValue constantValue1 = new ConstantValue();
        constantValue1.setValue("application/json");
        constantSchema1.setValue(constantValue1);
        constantHeader1.setSchema(constantSchema1);
        headers.add(constantHeader1);

        // Add another constant header
        Header constantHeader2 = new Header();
        constantHeader2.setHeader("x-custom-constant");
        ConstantSchema constantSchema2 = new ConstantSchema();
        ConstantValue constantValue2 = new ConstantValue();
        constantValue2.setValue("constant-value");
        constantSchema2.setValue(constantValue2);
        constantHeader2.setSchema(constantSchema2);
        headers.add(constantHeader2);

        // Add non-constant header
        Header variableHeader = new Header();
        variableHeader.setHeader("x-variable-header");
        StringSchema stringSchema = new StringSchema();
        variableHeader.setSchema(stringSchema);
        headers.add(variableHeader);

        httpProtocol.setHeaders(headers);
        protocols.setHttp(httpProtocol);
        response.setProtocol(protocols);

        operation.setResponses(Arrays.asList(response));

        return operation;
    }

    private Operation createOperationWithOnlyConstantHeaders() {
        Operation operation = new Operation();

        // Set up operation group
        OperationGroup operationGroup = new OperationGroup();
        Languages opGroupLanguages = new Languages();
        Language opGroupJava = new Language();
        opGroupJava.setName("TestOps");
        opGroupLanguages.setJava(opGroupJava);
        operationGroup.setLanguage(opGroupLanguages);
        operation.setOperationGroup(operationGroup);

        // Set up operation language
        Languages opLanguages = new Languages();
        Language opJava = new Language();
        opJava.setName("getConstantHeaders");
        opLanguages.setJava(opJava);
        operation.setLanguage(opLanguages);

        // Create response with only constant headers
        Response response = new Response();
        Protocols protocols = new Protocols();
        Protocol httpProtocol = new Protocol();

        // Create headers list with only constant headers
        ArrayList<Header> headers = new ArrayList<>();

        // Add constant header
        Header constantHeader = new Header();
        constantHeader.setHeader("content-type");
        ConstantSchema constantSchema = new ConstantSchema();
        ConstantValue constantValue = new ConstantValue();
        constantValue.setValue("application/json");
        constantSchema.setValue(constantValue);
        constantHeader.setSchema(constantSchema);
        headers.add(constantHeader);

        httpProtocol.setHeaders(headers);
        protocols.setHttp(httpProtocol);
        response.setProtocol(protocols);

        operation.setResponses(Arrays.asList(response));

        return operation;
    }
}
