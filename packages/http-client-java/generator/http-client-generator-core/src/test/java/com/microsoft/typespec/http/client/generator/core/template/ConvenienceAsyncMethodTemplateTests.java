// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ConvenienceAsyncMethodTemplateTests {

    private static final ClassType PAGE_ITEM
        = new ClassType.Builder().packageName("test.models").name("PageItem").build();

    @Test
    public void forwardsPageSizeWhenMappingPages() {
        String output = generatePagingConversion(PAGE_ITEM);

        Assertions
            .assertAll(() -> Assertions.assertTrue(output.contains("if (pageSizeParam == null)"), output),
                () -> Assertions.assertTrue(output.contains("pagedFluxResponse.byPage().take(1)"), output),
                () -> Assertions.assertTrue(output.contains("pagedFluxResponse.byPage(continuationTokenParam).take(1)"),
                    output),
                () -> Assertions.assertTrue(output.contains("pagedFluxResponse.byPage(pageSizeParam).take(1)"), output),
                () -> Assertions.assertTrue(
                    output.contains("pagedFluxResponse.byPage(continuationTokenParam, pageSizeParam).take(1)"),
                    output));
    }

    @Test
    public void preservesTypedMappingAndPageMetadata() {
        String output = generatePagingConversion(PAGE_ITEM);

        Assertions.assertAll(
            () -> Assertions.assertTrue(output.contains("protocolMethodData.toObject(PageItem.class)"), output),
            () -> Assertions.assertTrue(output.contains("pagedResponse.getRequest()"), output),
            () -> Assertions.assertTrue(output.contains("pagedResponse.getStatusCode()"), output),
            () -> Assertions.assertTrue(output.contains("pagedResponse.getHeaders()"), output),
            () -> Assertions.assertTrue(output.contains("pagedResponse.getContinuationToken()"), output));
    }

    @Test
    public void returnsProtocolFluxWhenNoConversionIsNeeded() {
        Assertions.assertEquals("return list(requestOptions);", generatePagingConversion(ClassType.BINARY_DATA).trim());
    }

    private static String generatePagingConversion(IType itemType) {
        ProxyMethod proxyMethod = new ProxyMethod.Builder().rawResponseBodyType(itemType)
            .responseContentTypes(Set.of("application/json"))
            .build();
        ClientMethod protocolMethod = pagingMethod(ClassType.BINARY_DATA, proxyMethod);
        ClientMethod convenienceMethod = pagingMethod(itemType, proxyMethod);
        JavaFileContents contents = new JavaFileContents();

        ConvenienceAsyncMethodTemplate.getInstance()
            .writeInvocationAndConversion(convenienceMethod, protocolMethod, "requestOptions", new JavaBlock(contents),
                new HashSet<>());

        return contents.toString();
    }

    private static ClientMethod pagingMethod(IType itemType, ProxyMethod proxyMethod) {
        return new ClientMethod.Builder().name("listAsync")
            .parameters(List.of())
            .type(ClientMethodType.PagingAsync)
            .proxyMethod(proxyMethod)
            .returnValue(new ReturnValue("The pages.", GenericType.pagedFlux(itemType)))
            .build();
    }
}
