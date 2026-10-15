// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ContinuationTokenPagingTests {
    @Test
    public void hidesTokenInWrapperDelegation() {
        JavaFileContents contents = new JavaFileContents();
        WrapperClientMethodTemplate.getInstance().write(pagingMethod(), new JavaClass(contents));
        String output = contents.toString();
        Assertions.assertTrue(output.contains("list(String filter)"));
        Assertions.assertTrue(output.contains("return this.serviceClient.list(filter);"));
        Assertions.assertFalse(output.contains("@param token"));
    }

    @Test
    public void hidesTokenInSyncOverAsyncDelegation() {
        JavaFileContents contents = new JavaFileContents();
        ServiceSyncClientWrapAsyncClientTemplate.getInstance().writeMethod(pagingMethod(), new JavaClass(contents));
        String output = contents.toString();
        Assertions.assertTrue(output.contains("list(String filter)"));
        Assertions.assertTrue(output.contains("return new PagedIterable<>(this.client.list(filter));"));
        Assertions.assertFalse(output.contains("@param token"));
    }

    private static ClientMethod pagingMethod() {
        ClientMethodParameter token = new ClientMethodParameter.Builder().name("token")
            .annotations(List.of())
            .description("The continuation token.")
            .wireType(ClassType.STRING)
            .build();
        ClientMethodParameter filter = new ClientMethodParameter.Builder().name("filter")
            .annotations(List.of())
            .description("The filter.")
            .wireType(ClassType.STRING)
            .required(true)
            .build();
        MethodPageDetails details = new MethodPageDetails(List.of(), null, null, null,
            new MethodPageDetails.ContinuationToken(null, token, "next-token", null), null, null);
        return new ClientMethod.Builder().name("list")
            .description("List items.")
            .parameters(List.of(filter, token))
            .type(ClientMethodType.PagingSync)
            .methodPageDetails(details)
            .returnValue(new ReturnValue("The items.", GenericType.pagedIterable(ClassType.STRING)))
            .build();
    }
}
