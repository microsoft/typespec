// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.DefaultMapperFactory;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelPropertySegment;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@Isolated
public class ContinuationTokenPagingTests {
    @TempDir
    Path compilationDirectory;

    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
        Mappers.setFactory(new DefaultMapperFactory());
        Templates.setFactory(new DefaultTemplateFactory());
    }

    @ParameterizedTest
    @ValueSource(strings = { "requestOptionsLocal", "requestLocal", "urlBuilder", "pageSize" })
    public void avoidsTokenLambdaNameCollisions(String tokenName) throws IOException {
        for (boolean pageSize : List.of(false, true)) {
            String output = renderPaging(RequestParameterLocation.QUERY, false, true, tokenName, pageSize);
            Assertions.assertTrue(output.contains("(" + tokenName + "1" + (pageSize ? ", pageSize" : "") + ") ->"),
                output);
            assertCompiles(output, "RequestOptions requestOptions");
        }
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "requestOptionsFilter",
            "requestOptionsLocal",
            "requestLocal",
            "urlBuilder",
            "pageSize",
            "initialContinuationToken" })
    public void preservesNonTokenParameterNames(String parameterName) throws IOException {
        ClientMethodParameter parameter = new ClientMethodParameter.Builder().name(parameterName)
            .annotations(List.of())
            .wireType(ClassType.STRING)
            .required(true)
            .build();
        for (boolean sync : List.of(false, true)) {
            for (boolean pageSize : List.of(false, true)) {
                for (RequestParameterLocation location : List.of(RequestParameterLocation.QUERY,
                    RequestParameterLocation.HEADER)) {
                    String output = renderPaging(location, sync, true, "token", pageSize, parameter);
                    assertCompiles(output, "String " + parameterName + ", RequestOptions requestOptions");
                }
            }
        }
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "requestOptionsFilter",
            "requestOptionsLocal",
            "requestOptionsForNextPage",
            "requestLocal",
            "urlBuilder",
            "pageSize",
            "nextLink",
            "httpRequest",
            "queryParams" })
    public void preservesNextLinkParameterNames(String parameterName) throws IOException {
        ClientMethodParameter parameter = new ClientMethodParameter.Builder().name(parameterName)
            .annotations(List.of())
            .wireType(ClassType.STRING)
            .required(true)
            .build();
        for (boolean sync : List.of(false, true)) {
            for (boolean pageSize : List.of(false, true)) {
                String output
                    = renderPaging(RequestParameterLocation.QUERY, sync, true, "token", pageSize, true, parameter);
                assertCompiles(output, "String " + parameterName + ", RequestOptions requestOptions");
            }
        }
    }

    @Test
    public void keepsTypedTokenAsOrdinaryParameterWithNextLink() throws IOException {
        for (boolean sync : List.of(false, true)) {
            String output = renderPaging(RequestParameterLocation.QUERY, sync, false, "token", false, true);
            Assertions.assertTrue(output.contains("list(String token, Context context)"), output);
            assertCompiles(output, "String token, Context context");
        }
    }

    @Test
    public void passesTypedTokenDirectlyWithContext() throws IOException {
        for (boolean sync : List.of(false, true)) {
            String output = renderPaging(RequestParameterLocation.QUERY, sync, false, "token", false);
            String singlePage = sync ? "listSinglePage" : "listSinglePageAsync";
            Assertions.assertTrue(output.contains(singlePage + "(token, context)"), output);
            Assertions.assertTrue(output.contains(singlePage + "(token1, context)"), output);
            Assertions.assertTrue(output.contains("list(String token, Context context)"), output);
            Assertions.assertFalse(output.contains("requestOptions"), output);
            assertCompiles(output, "String token, Context context");
        }
    }

    @Test
    public void passesQueryTokenThroughRequestOptions() {
        String output = renderProtocolPaging(RequestParameterLocation.QUERY, false);
        Assertions.assertTrue(output.contains("requestOptions == null ? new RequestOptions() : requestOptions"));
        Assertions.assertTrue(output.contains("setQueryParameter(\"token\", null)"));
        Assertions.assertTrue(output.contains("requestOptionsLocal.addQueryParam(\"token\", token, false)"));
        Assertions.assertTrue(output.contains("return list(null, requestOptions)"));
        Assertions.assertTrue(output.contains("list(String initialContinuationToken, RequestOptions requestOptions)"));
        Assertions.assertTrue(output.contains("if (initialContinuationToken != null)"));
        Assertions.assertTrue(output.contains("addQueryParam(\"token\", initialContinuationToken, false)"));
        Assertions.assertTrue(output.contains("listSinglePageAsync(requestOptionsLocal)"));
        Assertions.assertFalse(output.contains("listSinglePageAsync(token,"));
    }

    @Test
    public void passesHeaderTokenThroughRequestOptions() {
        String output = renderProtocolPaging(RequestParameterLocation.HEADER, true);
        Assertions.assertTrue(output.contains("requestOptions == null ? new RequestOptions() : requestOptions"));
        Assertions.assertTrue(output.contains("getHeaders().remove(\"token\")"));
        Assertions.assertTrue(output.contains("requestOptionsLocal.setHeader(\"token\", token)"));
        Assertions.assertTrue(output.contains("return list(null, requestOptions)"));
        Assertions.assertTrue(output.contains("setHeader(\"token\", initialContinuationToken)"));
        Assertions.assertTrue(output.contains("listSinglePage(requestOptionsLocal)"));
    }

    private static String renderProtocolPaging(RequestParameterLocation location, boolean sync) {
        return renderPaging(location, sync, true, "token", false);
    }

    private static String renderPaging(RequestParameterLocation location, boolean sync, boolean dataPlane,
        String tokenName, boolean pageSize, ClientMethodParameter... additionalParameters) {
        return renderPaging(location, sync, dataPlane, tokenName, pageSize, false, additionalParameters);
    }

    private static String renderPaging(RequestParameterLocation location, boolean sync, boolean dataPlane,
        String tokenName, boolean pageSize, boolean nextLink, ClientMethodParameter... additionalParameters) {
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
        ClientMethodParameter typedToken = new ClientMethodParameter.Builder().name(tokenName)
            .annotations(List.of())
            .wireType(ClassType.STRING)
            .build();
        ProxyMethodParameter maxPageSize = new ProxyMethodParameter.Builder().name("maxPageSize")
            .requestParameterName("maxpagesize")
            .requestParameterLocation(RequestParameterLocation.QUERY)
            .wireType(ClassType.INTEGER)
            .build();
        List<ClientMethodParameter> parameters = new ArrayList<>(List.of(additionalParameters));
        parameters.addAll(dataPlane
            ? List.of(ClientMethodParameter.REQUEST_OPTIONS_PARAMETER)
            : List.of(typedToken, ClientMethodParameter.CONTEXT_PARAMETER));
        ClientMethod nextMethod = new ClientMethod.Builder().name("listNext")
            .parameters(List.of(
                new ClientMethodParameter.Builder().name("nextLink")
                    .annotations(List.of())
                    .wireType(ClassType.STRING)
                    .required(true)
                    .build(),
                dataPlane ? ClientMethodParameter.REQUEST_OPTIONS_PARAMETER : ClientMethodParameter.CONTEXT_PARAMETER))
            .proxyMethod(new ProxyMethod.Builder().name("listNext").build())
            .build();
        ClientMethod method = pagingMethod().newBuilder()
            .type(sync ? ClientMethodType.PagingSync : ClientMethodType.PagingAsync)
            .returnValue(new ReturnValue("The items.",
                sync ? GenericType.pagedIterable(ClassType.STRING) : GenericType.pagedFlux(ClassType.STRING)))
            .parameters(parameters)
            .proxyMethod(new ProxyMethod.Builder().name("list")
                .parameters(List.of())
                .allParameters(pageSize ? List.of(maxPageSize) : List.of())
                .build())
            .methodPageDetails(new MethodPageDetails(List.of(),
                nextLink
                    ? List.of(new ModelPropertySegment(null,
                        new ClientModelProperty.Builder().name("nextLink")
                            .serializedName("nextLink")
                            .wireType(ClassType.STRING)
                            .clientType(ClassType.STRING)
                            .build()))
                    : null,
                nextLink ? nextMethod : null, null,
                nextLink
                    ? null
                    : new MethodPageDetails.ContinuationToken(token, dataPlane ? null : typedToken, "next-token", null),
                null, nextLink && dataPlane ? new MethodPageDetails.NextLinkReInjection(List.of("filter")) : null))
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

    private void assertCompiles(String method, String singlePageParameters) throws IOException {
        String source = "import com.azure.core.annotation.*;\n" + "import com.azure.core.http.rest.*;\n"
            + "import com.azure.core.util.*;\n" + "import reactor.core.publisher.Mono;\n" + "import java.util.Map;\n"
            + "public class PagingCompilation {\n" + method
            + "\nprivate Mono<PagedResponse<String>> listSinglePageAsync(" + singlePageParameters
            + ") { return Mono.empty(); }\n" + "private PagedResponse<String> listSinglePage(" + singlePageParameters
            + ") { return null; }\n"
            + "private Mono<PagedResponse<String>> listNextSinglePageAsync(String nextLink, RequestOptions options) { return Mono.empty(); }\n"
            + "private PagedResponse<String> listNextSinglePage(String nextLink, RequestOptions options) { return null; }\n"
            + "private Mono<PagedResponse<String>> listNextSinglePageAsync(String nextLink, Context context) { return Mono.empty(); }\n"
            + "private PagedResponse<String> listNextSinglePage(String nextLink, Context context) { return null; }\n"
            + "}\n";
        Path file = compilationDirectory.resolve("PagingCompilation.java");
        Files.writeString(file, source);
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        int result = ToolProvider.getSystemJavaCompiler()
            .run(null, diagnostics, diagnostics, "--release", "11", "-classpath",
                System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")), "-d",
                compilationDirectory.toString(), file.toString());
        Assertions.assertEquals(0, result, () -> diagnostics.toString(StandardCharsets.UTF_8) + "\n" + source);
    }

    @Test
    public void preservesTokenInWrapperDelegation() {
        JavaFileContents contents = new JavaFileContents();
        WrapperClientMethodTemplate.getInstance().write(pagingMethod(), new JavaClass(contents));
        String output = contents.toString();
        Assertions.assertTrue(output.contains("list(String filter, String token)"));
        Assertions.assertTrue(output.contains("return this.serviceClient.list(filter, token);"));
        Assertions.assertTrue(output.contains("@param token"));
    }

    @Test
    public void preservesTokenInSyncOverAsyncDelegation() {
        JavaFileContents contents = new JavaFileContents();
        ServiceSyncClientWrapAsyncClientTemplate.getInstance().writeMethod(pagingMethod(), new JavaClass(contents));
        String output = contents.toString();
        Assertions.assertTrue(output.contains("list(String filter, String token)"));
        Assertions.assertTrue(output.contains("return new PagedIterable<>(this.client.list(filter, token));"));
        Assertions.assertTrue(output.contains("@param token"));
    }

    @Test
    public void keepsClientCoreTokenHidden() {
        new MockUnitJavagen() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                return "flavor".equals(key) ? (T) "unbranded" : super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
        Assertions.assertEquals("String filter", pagingMethod().getParametersDeclaration());
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
