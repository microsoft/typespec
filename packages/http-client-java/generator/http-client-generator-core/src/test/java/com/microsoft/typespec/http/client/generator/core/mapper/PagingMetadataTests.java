// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Header;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.PageableContinuationToken;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsPageable;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
public class PagingMetadataTests {
    @AfterEach
    public void restoreSettings() {
        ClientModels.getInstance().clear();
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @Test
    public void prefersNextLinkOverContinuationToken() {
        new MockUnitJavagen();
        JavaSettings.clear();
        ClientModel model = new ClientModel.Builder().name("PagingMetadataResponse")
            .packageName("com.azure.test")
            .properties(List.of(
                new ClientModelProperty.Builder().name("items")
                    .serializedName("items")
                    .wireType(new ListType(ClassType.STRING))
                    .clientType(new ListType(ClassType.STRING))
                    .build(),
                new ClientModelProperty.Builder().name("nextLink")
                    .serializedName("nextLink")
                    .wireType(ClassType.STRING)
                    .clientType(ClassType.STRING)
                    .build()))
            .build();
        ClientModels.getInstance().addModel(model);
        StringSchema schema = new StringSchema();
        schema.setType(Schema.AllSchemaTypes.STRING);
        Language language = new Language();
        language.setName("token");
        language.setSerializedName("token");
        Languages languages = new Languages();
        languages.setJava(language);
        languages.setDefault(language);
        Protocol http = new Protocol();
        http.setIn(RequestParameterLocation.QUERY);
        Protocols protocols = new Protocols();
        protocols.setHttp(http);
        Parameter parameter = new Parameter();
        parameter.setSchema(schema);
        parameter.setLanguage(languages);
        parameter.setProtocol(protocols);
        Header header = new Header();
        header.setHeader("next-token");
        PageableContinuationToken continuationToken = new PageableContinuationToken();
        continuationToken.setParameter(parameter);
        continuationToken.setResponseHeader(header);
        XmsPageable pageable = new XmsPageable();
        pageable.setItemName("items");
        pageable.setContinuationToken(continuationToken);
        XmsExtensions extensions = new XmsExtensions();
        extensions.setXmsPageable(pageable);
        Operation operation = new Operation();
        operation.setExtensions(extensions);
        ClientMethodParameter token = new ClientMethodParameter.Builder().name("token")
            .annotations(List.of())
            .wireType(ClassType.STRING)
            .build();
        ClientMethodParametersDetails parameters = new ClientMethodParametersDetails(
            List.of(new ParametersTuple(parameter, token)), List.of(), Map.of(), null);
        ProxyMethod proxy = new ProxyMethod.Builder().name("list")
            .responseBodyType(new ClassType.Builder().name(model.getName()).packageName(model.getPackage()).build())
            .build();
        for (boolean nextLink : List.of(false, true)) {
            pageable.setNextLinkName(nextLink ? "nextLink" : null);
            PagingMetadata metadata = PagingMetadata.create(operation, proxy, parameters, JavaSettings.getInstance());
            Assertions.assertNotNull(metadata);
            for (boolean sync : List.of(false, true)) {
                MethodPageDetails details = metadata.asMethodPageDetails(sync);
                Assertions.assertEquals(nextLink, details.nonNullNextLink());
                Assertions.assertEquals(nextLink, details.getContinuationToken() == null);
                ClientMethod method = new ClientMethod.Builder().name("list")
                    .parameters(List.of(token, ClientMethodParameter.CONTEXT_PARAMETER))
                    .methodPageDetails(details)
                    .type(sync ? ClientMethodType.PagingSync : ClientMethodType.PagingAsync)
                    .returnValue(new ReturnValue("The items.",
                        sync ? GenericType.pagedIterable(ClassType.STRING) : GenericType.pagedFlux(ClassType.STRING)))
                    .build();
                Assertions.assertTrue(method.getParametersDeclaration().contains("String token"));
            }
        }
    }
}
