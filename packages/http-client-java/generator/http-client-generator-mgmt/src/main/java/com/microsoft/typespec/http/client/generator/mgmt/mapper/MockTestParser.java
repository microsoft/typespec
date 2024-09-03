// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentCollectionMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentMethodMockUnitTest;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentResourceCreateExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.ResourceCreate;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleNode;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.ModelExampleUtil;
import com.microsoft.typespec.http.client.generator.core.util.ModelTestCaseUtil;
import com.microsoft.typespec.http.client.generator.core.util.PossibleCredentialException;
import com.azure.core.http.HttpMethod;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MockTestParser extends ExampleParser {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), MockTestParser.class);

    public List<FluentMethodMockUnitTest> parseResourceCollectionForUnitTest(FluentResourceCollection resourceCollection) {
        List<FluentMethodMockUnitTest> fluentMethodMockUnitTests = new ArrayList<>();

        resourceCollection.getMethodsForTemplate().forEach(m -> {
            FluentMethodMockUnitTest example = parseMethod(resourceCollection, m);
            if (example != null) {
                fluentMethodMockUnitTests.add(example);
            }
        });
        resourceCollection.getResourceCreates().forEach(rc -> {
            FluentMethodMockUnitTest example = parseResourceCreate(resourceCollection, rc);
            if (example != null) {
                fluentMethodMockUnitTests.add(example);
            }
        });
        return fluentMethodMockUnitTests;
    }

    private static FluentMethodMockUnitTest parseResourceCreate(FluentResourceCollection collection, ResourceCreate resourceCreate) {
        FluentMethodMockUnitTest unitTest = null;

        try {
            List<FluentCollectionMethod> collectionMethods = resourceCreate.getMethodReferences();
            for (FluentCollectionMethod collectionMethod : collectionMethods) {
                ClientMethod clientMethod = collectionMethod.getInnerClientMethod();
                if (FluentUtils.validRequestContentTypeToGenerateExample(clientMethod) && FluentUtils.validResponseContentTypeToGenerateExample(clientMethod) && requiresExample(clientMethod)) {
                    List<MethodParameter> methodParameters = MethodUtil.getParameters(clientMethod);
                    MethodParameter requestBodyParameter = findRequestBodyParameter(methodParameters);
                    ProxyMethodExample proxyMethodExample = createProxyMethodExample(clientMethod, methodParameters);
                    FluentResourceCreateExample resourceCreateExample =
                            parseResourceCreate(collection, resourceCreate, proxyMethodExample, methodParameters, requestBodyParameter);

                    ResponseInfo responseInfo = createProxyMethodExampleResponse(clientMethod);
                    unitTest = new FluentMethodMockUnitTest(resourceCreateExample, collection, collectionMethod,
                            FluentUtils.isResponseType(collectionMethod.getFluentReturnType()) ? FluentUtils.getValueTypeFromResponseType(collectionMethod.getFluentReturnType()) : collectionMethod.getFluentReturnType(),
                            responseInfo.responseExample, responseInfo.verificationObjectName, responseInfo.verificationNode);

                    break;
                }
            }
        } catch (PossibleCredentialException e) {
            LOGGER.warn("Skip unit test for resource '{}', caused by key '{}'", resourceCreate.getResourceModel().getInnerModel().getName(), e.getKeyName());
        }
        return unitTest;
    }

    private static FluentMethodMockUnitTest parseMethod(FluentResourceCollection collection, FluentCollectionMethod collectionMethod) {
        FluentMethodMockUnitTest unitTest = null;

        try {
            ClientMethod clientMethod = collectionMethod.getInnerClientMethod();
            if (FluentUtils.validRequestContentTypeToGenerateExample(clientMethod) && FluentUtils.validResponseContentTypeToGenerateExample(clientMethod) && requiresExample(clientMethod)) {
                List<MethodParameter> methodParameters = MethodUtil.getParameters(clientMethod);
                ProxyMethodExample proxyMethodExample = createProxyMethodExample(clientMethod, methodParameters);
                FluentCollectionMethodExample collectionMethodExample =
                        parseMethodForExample(collection, collectionMethod, methodParameters, proxyMethodExample.getName(), proxyMethodExample);

                ResponseInfo responseInfo = createProxyMethodExampleResponse(clientMethod);
                unitTest = new FluentMethodMockUnitTest(collectionMethodExample, collection, collectionMethod, collectionMethod.getFluentReturnType(),
                        responseInfo.responseExample, responseInfo.verificationObjectName, responseInfo.verificationNode);
            }
        } catch (PossibleCredentialException e) {
            LOGGER.warn("Skip unit test for method '{}', caused by key '{}'", collectionMethod.getMethodName(), e.getKeyName());
        }
        return unitTest;
    }

    private static ProxyMethodExample createProxyMethodExample(ClientMethod clientMethod, List<MethodParameter> methodParameters) {
        ProxyMethodExample.Builder example = new ProxyMethodExample.Builder()
                .name(clientMethod.getName());

        for (MethodParameter methodParameter : methodParameters) {
            // create mock data for each parameter

            String serializedName = methodParameter.getSerializedName();
            if (serializedName == null && methodParameter.getProxyMethodParameter().getRequestParameterLocation() == RequestParameterLocation.BODY) {
                serializedName = methodParameter.getProxyMethodParameter().getName();
            }

            Object jsonParam;
            if (methodParameter.getProxyMethodParameter().getCollectionFormat() != null
                    && methodParameter.getProxyMethodParameter().getWireType() == ClassType.STRING
                    && methodParameter.getProxyMethodParameter().getClientType() instanceof ListType) {
                // use element type without delimiter
                jsonParam = ModelTestCaseUtil.jsonFromType(0, ((ListType) methodParameter.getProxyMethodParameter().getClientType()).getElementType()).toString();
            } else {
                jsonParam = ModelTestCaseUtil.jsonFromType(0, methodParameter.getProxyMethodParameter().getWireType());
            }

            example.parameter(serializedName, jsonParam);
        }

        return example.build();
    }

    private static class ResponseInfo {
        private final ProxyMethodExample.Response responseExample;
        private final ExampleNode verificationNode;
        private final String verificationObjectName;

        private ResponseInfo(ProxyMethodExample.Response responseExample,
                             ExampleNode verificationNode, String verificationObjectName) {
            this.responseExample = responseExample;
            this.verificationNode = verificationNode;
            this.verificationObjectName = verificationObjectName;
        }
    }

    private static ResponseInfo createProxyMethodExampleResponse(ClientMethod clientMethod) {
        // create a mock response

        int statusCode = clientMethod.getProxyMethod().getResponseExpectedStatusCodes().iterator().next();
        Object jsonObject;
        ExampleNode verificationNode;
        String verificationObjectName;

        IType clientReturnType = clientMethod.getReturnValue().getType();
        final boolean isResponseType = FluentUtils.isResponseType(clientReturnType);
        if (isResponseType) {
            clientReturnType = FluentUtils.getValueTypeFromResponseType(clientReturnType);
        }

        if (clientMethod.getType() == ClientMethodType.PagingSync) {
            // pageable
            if (clientReturnType instanceof GenericType) {
                IType elementType = ((GenericType) clientReturnType).getTypeArguments()[0];

                Object firstJsonObjectInPageable = ModelTestCaseUtil.jsonFromType(0, elementType);
                // put to first element in array
                Map<String, Object> jsonMap = new HashMap<>();
                jsonMap.put(clientMethod.getMethodPageDetails().getSerializedItemName(), Collections.singletonList(firstJsonObjectInPageable));

                jsonObject = jsonMap;

                // pageable will verify the first element
                verificationObjectName = "response.iterator().next()";
                verificationNode = ModelExampleUtil.parseNode(elementType, firstJsonObjectInPageable);
            } else {
                throw new IllegalStateException("Response of pageable operation must be PagedIterable<>");
            }
        } else {
            // simple or LRO
            jsonObject = ModelTestCaseUtil.jsonFromType(0, clientReturnType);

            if (jsonObject == null) {
                jsonObject = new Object();
            }
            if (clientMethod.getType() == ClientMethodType.LongRunningSync) {
                // LRO, hack to set properties.provisioningState == Succeeded, so that LRO can stop at activation operation
                setProvisioningState(jsonObject);
            }

            verificationObjectName = "response";
            verificationNode = ModelExampleUtil.parseNode(clientReturnType, jsonObject);
        }
        Map<String, Object> responseObject = new HashMap<>();
        responseObject.put("body", jsonObject);
        return new ResponseInfo(new ProxyMethodExample.Response(statusCode, responseObject), verificationNode, verificationObjectName);
    }

    private static boolean requiresExample(ClientMethod clientMethod) {
        if (clientMethod.getType() == ClientMethodType.SimpleSync
                || clientMethod.getType() == ClientMethodType.SimpleSyncRestResponse
                // pageable
                || (clientMethod.getType() == ClientMethodType.PagingSync
                    // not pageable + LRO
                    && clientMethod.getMethodPageDetails().getLroIntermediateType() == null)
                // LRO
                || (clientMethod.getType() == ClientMethodType.LongRunningSync
                    // limit the scope of LRO to status code of 200
                    && clientMethod.getProxyMethod().getResponseExpectedStatusCodes().contains(200)
                    // also azure-core-management does not support LRO from GET
                    && clientMethod.getProxyMethod().getHttpMethod() != HttpMethod.GET)) {
            // generate example for the method with full parameters
            return clientMethod.getParameters().stream().anyMatch(p -> ClassType.CONTEXT.equals(p.getClientType()));
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private static void setProvisioningState(Object jsonObject) {
        // properties.provisioningState = Succeeded
        if ((jsonObject instanceof Map) && ((Map<String, Object>) jsonObject).containsKey("properties")) {
            Object propertiesObject = ((Map<String, Object>) jsonObject).get("properties");
            if ((propertiesObject instanceof Map) && ((Map<String, Object>) propertiesObject).containsKey("provisioningState")) {
                Object provisioningStateObject = ((Map<String, Object>) propertiesObject).get("provisioningState");
                if (provisioningStateObject instanceof String) {
                    ((Map<String, Object>) propertiesObject).put("provisioningState", "Succeeded");
                }
            }
        }
    }
}
