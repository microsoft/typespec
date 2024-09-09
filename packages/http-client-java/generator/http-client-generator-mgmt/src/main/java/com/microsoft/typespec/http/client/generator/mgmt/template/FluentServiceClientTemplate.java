// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.template.ServiceClientTemplate;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;
import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpResponse;
import com.azure.core.http.rest.Response;
import com.azure.core.management.exception.ManagementError;
import com.azure.core.management.exception.ManagementException;
import com.azure.core.management.polling.PollResult;
import com.azure.core.management.polling.PollerFactory;
import com.azure.core.util.Context;
import com.azure.core.util.CoreUtils;
import com.azure.core.util.polling.AsyncPollResponse;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.PollerFlux;
import com.azure.core.util.serializer.SerializerEncoding;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;

public class FluentServiceClientTemplate extends ServiceClientTemplate {

    private static final FluentServiceClientTemplate INSTANCE = new FluentServiceClientTemplate();
    static {
        if (JavaSettings.getInstance().isFluentLite()) {
            MethodTemplate getContextMethod = MethodTemplate.builder()
                    .imports(Collections.singleton(Context.class.getName()))
                    .methodSignature("Context getContext()")
                    .comment(comment -> {
                        comment.description("Gets default client context.");
                        comment.methodReturns("the default client context.");
                    })
                    .method(method -> method.methodReturn("Context.NONE"))
                    .build();

            MethodTemplate mergeContextMethod = MethodTemplate.builder()
                    .imports(Arrays.asList(
                            Context.class.getName(),
                            CoreUtils.class.getName(),
                            Map.class.getName()))
                    .methodSignature("Context mergeContext(Context context)")
                    .comment(comment -> {
                        comment.description("Merges default client context with provided context.");
                        comment.param("context", "the context to be merged with default client context.");
                        comment.methodReturns("the merged context.");
                    })
                    .method(method -> method.methodReturn("CoreUtils.mergeContexts(this.getContext(), context)"))
                    .build();

            MethodTemplate getLroResultMethod = MethodTemplate.builder()
                    .imports(Arrays.asList(
                            PollerFlux.class.getName(),
                            PollResult.class.getName(),
                            Mono.class.getName(),
                            Flux.class.getName(),
                            Response.class.getName(),
                            ByteBuffer.class.getName(),
                            Type.class.getName(),
                            PollerFactory.class.getName()))
                    .methodSignature("<T, U> PollerFlux<PollResult<T>, U> getLroResult(Mono<Response<Flux<ByteBuffer>>> activationResponse, HttpPipeline httpPipeline, Type pollResultType, Type finalResultType, Context context)")
                    .comment(comment -> {
                        comment.description("Gets long running operation result.");
                        comment.param("activationResponse", "the response of activation operation.");
                        comment.param("httpPipeline", "the http pipeline.");
                        comment.param("pollResultType", "type of poll result.");
                        comment.param("finalResultType", "type of final result.");
                        comment.param("context", "the context shared by all requests.");
                        comment.param("<T>", "type of poll result.");
                        comment.param("<U>", "type of final result.");
                        comment.methodReturns("poller flux for poll result and final result.");
                    })
                    .method(method -> method.methodReturn("PollerFactory.create(serializerAdapter, httpPipeline, pollResultType, finalResultType, defaultPollInterval, activationResponse, context)"))
                    .build();

            MethodTemplate getLroFinalResultOrErrorMethod = MethodTemplate.builder()
                    .imports(Arrays.asList(
                            PollerFlux.class.getName(),
                            PollResult.class.getName(),
                            Mono.class.getName(),
                            AsyncPollResponse.class.getName(),
                            ManagementError.class.getName(),
                            ManagementException.class.getName(),
                            HttpResponse.class.getName(),
                            LongRunningOperationStatus.class.getName(),
                            SerializerEncoding.class.getName(),
                            IOException.class.getName(),
                            // below import is actually used in HttpResponseImpl
                            HttpHeaders.class.getName(),
                            Charset.class.getName(),
                            StandardCharsets.class.getName()))
                    .methodSignature("<T, U> Mono<U> getLroFinalResultOrError(AsyncPollResponse<PollResult<T>, U> response)")
                    .comment(comment -> {
                        comment.description("Gets the final result, or an error, based on last async poll response.");
                        comment.param("response", "the last async poll response.");
                        comment.param("<T>", "type of poll result.");
                        comment.param("<U>", "type of final result.");
                        comment.methodReturns("the final result, or an error.");
                    })
                    .method(method -> method.text(FluentUtils.loadTextFromResource("Client_getLroFinalResultOrError.txt")))
                    .build();

            INSTANCE.additionalMethods.add(getContextMethod);
            INSTANCE.additionalMethods.add(mergeContextMethod);
            INSTANCE.additionalMethods.add(getLroResultMethod);
            INSTANCE.additionalMethods.add(getLroFinalResultOrErrorMethod);
        }
    }

    public static FluentServiceClientTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void writeAdditionalClassBlock(JavaClass classBlock) {
        if (JavaSettings.getInstance().isFluentLite()) {
            classBlock.privateStaticFinalClass("HttpResponseImpl extends HttpResponse", block -> {
                block.privateFinalMemberVariable("int", "statusCode");
                block.privateFinalMemberVariable("byte[]", "responseBody");
                block.privateFinalMemberVariable("HttpHeaders", "httpHeaders");

                block.packagePrivateConstructor("HttpResponseImpl(int statusCode, HttpHeaders httpHeaders, String responseBody)", code -> {
                    code.line("super(null);");
                    code.line("this.statusCode = statusCode;");
                    code.line("this.httpHeaders = httpHeaders;");
                    code.line("this.responseBody = responseBody == null ? null : responseBody.getBytes(StandardCharsets.UTF_8);");
                });

                block.publicMethod("int getStatusCode()", code -> {
                    code.methodReturn("statusCode");
                });

                block.publicMethod("String getHeaderValue(String s)", code -> {
                    code.methodReturn("httpHeaders.getValue(HttpHeaderName.fromString(s))");
                });

                block.publicMethod("HttpHeaders getHeaders()", code -> {
                    code.methodReturn("httpHeaders");
                });

                block.publicMethod("Flux<ByteBuffer> getBody()", code -> {
                    code.methodReturn("Flux.just(ByteBuffer.wrap(responseBody))");
                });

                block.publicMethod("Mono<byte[]> getBodyAsByteArray()", code -> {
                    code.methodReturn("Mono.just(responseBody)");
                });

                block.publicMethod("Mono<String> getBodyAsString()", code -> {
                    code.methodReturn("Mono.just(new String(responseBody, StandardCharsets.UTF_8))");
                });

                block.publicMethod("Mono<String> getBodyAsString(Charset charset)", code -> {
                    code.methodReturn("Mono.just(new String(responseBody, charset))");
                });
            });
        }
    }
}
