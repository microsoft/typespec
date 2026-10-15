// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@Isolated
public class ContinuationTokenPagingTests {
    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @ParameterizedTest
    @ValueSource(strings = { "requestOptionsLocal", "requestLocal", "urlBuilder", "pageSize" })
    public void avoidsTokenLambdaNameCollisions(String tokenName) {
        for (boolean pageSize : List.of(false, true)) {
            String output = renderPaging(RequestParameterLocation.QUERY, false, true, tokenName, pageSize);
            Assertions.assertTrue(output.contains("(" + tokenName + "1" + (pageSize ? ", pageSize" : "") + ") ->"),
                output);
        }
    }

    @Test
    public void passesTypedTokenDirectlyWithContext() {
        for (boolean sync : List.of(false, true)) {
            String output = renderPaging(RequestParameterLocation.QUERY, sync, false, "token", false);
            String singlePage = sync ? "listSinglePage" : "listSinglePageAsync";
            Assertions.assertTrue(output.contains(singlePage + "(null, context)"), output);
            Assertions.assertTrue(output.contains(singlePage + "(token, context)"), output);
            Assertions.assertFalse(output.contains("requestOptions"), output);
        }
    }

    @Test
    public void passesQueryTokenThroughRequestOptions() {
        String output = renderProtocolPaging(RequestParameterLocation.QUERY, false);
        Assertions.assertTrue(output.contains("requestOptions == null ? new RequestOptions() : requestOptions"));
        Assertions.assertTrue(output.contains("setQueryParameter(\"token\", null)"));
        Assertions.assertTrue(output.contains("requestOptionsLocal.addQueryParam(\"token\", token, false)"));
        Assertions.assertTrue(output.contains("listSinglePageAsync(requestOptionsLocal)"));
        Assertions.assertFalse(output.contains("listSinglePageAsync(token,"));
    }

    @Test
    public void passesHeaderTokenThroughRequestOptions() {
        String output = renderProtocolPaging(RequestParameterLocation.HEADER, true);
        Assertions.assertTrue(output.contains("requestOptions == null ? new RequestOptions() : requestOptions"));
        Assertions.assertTrue(output.contains("getHeaders().remove(\"token\")"));
        Assertions.assertTrue(output.contains("requestOptionsLocal.setHeader(\"token\", token)"));
        Assertions.assertTrue(output.contains("listSinglePage(requestOptionsLocal)"));
    }

    private static String renderProtocolPaging(RequestParameterLocation location, boolean sync) {
        return renderPaging(location, sync, true, "token", false);
    }

    private static String renderPaging(RequestParameterLocation location, boolean sync, boolean dataPlane,
        String tokenName, boolean pageSize) {
        new MockUnitJavagen() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                if ("data-plane".equals(key)) {
                    return (T) Boolean.valueOf(dataPlane);
                }
                if ("enable-page-size".equals(key)) {
                    return (T) Boolean.valueOf(pageSize);
                }
                return super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
        ProxyMethodParameter token = new ProxyMethodParameter.Builder().name(tokenName)
            .requestParameterName(tokenName)
            .requestParameterLocation(location)
            .wireType(ClassType.STRING)
            .build();
        ClientMethodParameter typedToken
            = new ClientMethodParameter.Builder().name(tokenName).wireType(ClassType.STRING).build();
        ProxyMethodParameter maxPageSize = new ProxyMethodParameter.Builder().name("maxPageSize")
            .requestParameterName("maxpagesize")
            .requestParameterLocation(RequestParameterLocation.QUERY)
            .wireType(ClassType.INTEGER)
            .build();
        ClientMethod method = pagingMethod().newBuilder()
            .parameters(dataPlane
                ? List.of(ClientMethodParameter.REQUEST_OPTIONS_PARAMETER)
                : List.of(typedToken, ClientMethodParameter.CONTEXT_PARAMETER))
            .proxyMethod(new ProxyMethod.Builder().name("list")
                .parameters(List.of())
                .allParameters(pageSize ? List.of(maxPageSize) : List.of())
                .build())
            .methodPageDetails(new MethodPageDetails(List.of(), null, null, null,
                new MethodPageDetails.ContinuationToken(token, dataPlane ? null : typedToken, "next-token", null), null,
                null))
            .build();
        JavaFileContents contents = new JavaFileContents();
        if (sync) {
            ClientMethodTemplate.getInstance()
                .generatePagingPlainSync(method, new JavaClass(contents), JavaSettings.getInstance());
        } else {
            ClientMethodTemplate.getInstance()
                .generatePagingAsync(method, new JavaClass(contents), JavaSettings.getInstance());
        }
        return contents.toString();
    }

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
