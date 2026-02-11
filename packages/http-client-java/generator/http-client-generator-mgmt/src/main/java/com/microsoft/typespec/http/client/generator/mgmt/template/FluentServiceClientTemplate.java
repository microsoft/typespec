// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.template.ServiceClientTemplate;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class FluentServiceClientTemplate extends ServiceClientTemplate {

    private static final FluentServiceClientTemplate INSTANCE = new FluentServiceClientTemplate();
    static {
        if (JavaSettings.getInstance().isFluentLite()) {
            MethodTemplate getContextMethod = MethodTemplate.builder()
                .imports(List.of(ClassType.CONTEXT.getFullName()))
                .methodSignature("Context getContext()")
                .comment(comment -> {
                    comment.description("Gets default client context.");
                    comment.methodReturns("the default client context.");
                })
                .method(method -> method.methodReturn("Context.NONE"))
                .build();

            MethodTemplate mergeContextMethod = MethodTemplate.builder()
                .imports(
                    List.of(ClassType.CONTEXT.getFullName(), ClassType.CORE_UTILS.getFullName(), Map.class.getName()))
                .methodSignature("Context mergeContext(Context context)")
                .comment(comment -> {
                    comment.description("Merges default client context with provided context.");
                    comment.param("context", "the context to be merged with default client context.");
                    comment.methodReturns("the merged context.");
                })
                .method(method -> method.methodReturn("CoreUtils.mergeContexts(this.getContext(), context)"))
                .build();

            MethodTemplate getLroResultMethod = MethodTemplate.builder()
                .imports(List.of(ClassType.POLLER_FLUX.getFullName(), ClassType.POLL_RESULT.getFullName(),
                    ClassType.MONO.getFullName(), ClassType.FLUX.getFullName(), ClassType.RESPONSE.getFullName(),
                    ByteBuffer.class.getName(), Type.class.getName(), ClassType.POLLER_FACTORY.getFullName()))
                .methodSignature(
                    "<T, U> PollerFlux<PollResult<T>, U> getLroResult(Mono<Response<Flux<ByteBuffer>>> activationResponse, HttpPipeline httpPipeline, Type pollResultType, Type finalResultType, Context context)")
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
                .method(method -> method.methodReturn(
                    "PollerFactory.create(serializerAdapter, httpPipeline, pollResultType, finalResultType, defaultPollInterval, activationResponse, context)"))
                .build();

            MethodTemplate getLroResultSyncMethod = MethodTemplate.builder()
                .imports(List.of(ClassType.POLL_RESULT.getFullName(), ClassType.RESPONSE.getFullName(),
                    Type.class.getName(), ClassType.SYNC_POLLER_FACTORY.getFullName(),
                    ClassType.BINARY_DATA.getFullName(), ClassType.SYNC_POLLER.getFullName()))
                .methodSignature(
                    "<T, U> SyncPoller<PollResult<T>, U> getLroResult(Response<BinaryData> activationResponse, Type pollResultType, Type finalResultType, Context context)")
                .comment(comment -> {
                    comment.description("Gets long running operation result.");
                    comment.param("activationResponse", "the response of activation operation.");
                    comment.param("pollResultType", "type of poll result.");
                    comment.param("finalResultType", "type of final result.");
                    comment.param("context", "the context shared by all requests.");
                    comment.param("<T>", "type of poll result.");
                    comment.param("<U>", "type of final result.");
                    comment.methodReturns("SyncPoller for poll result and final result.");
                })
                .method(method -> method.methodReturn(
                    "SyncPollerFactory.create(serializerAdapter, httpPipeline, pollResultType, finalResultType, defaultPollInterval, () -> activationResponse, context)"))
                .build();

            MethodTemplate getLroFinalResultOrErrorMethod = MethodTemplate.builder()
                .imports(List.of(ClassType.POLLER_FLUX.getFullName(), ClassType.POLL_RESULT.getFullName(),
                    ClassType.MONO.getFullName(), ClassType.ASYNC_POLL_RESPONSE.getFullName(),
                    FluentType.MANAGEMENT_ERROR.getFullName(), FluentType.MANAGEMENT_EXCEPTION.getFullName(),
                    ClassType.HTTP_RESPONSE.getFullName(), ClassType.LONG_RUNNING_OPERATION_STATUS.getFullName(),
                    ClassType.SERIALIZER_ENCODING.getFullName(), IOException.class.getName(),
                    // below import is actually used in HttpResponseImpl
                    ClassType.HTTP_HEADERS.getFullName(), Charset.class.getName(), StandardCharsets.class.getName()))
                .methodSignature(
                    "<T, U> Mono<U> getLroFinalResultOrError(AsyncPollResponse<PollResult<T>, U> response)")
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
            if (JavaSettings.getInstance().isSyncStackEnabled()) {
                INSTANCE.additionalMethods.add(getLroResultSyncMethod);
            }
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

                block.packagePrivateConstructor(
                    "HttpResponseImpl(int statusCode, HttpHeaders httpHeaders, String responseBody)", code -> {
                        code.line("super(null);");
                        code.line("this.statusCode = statusCode;");
                        code.line("this.httpHeaders = httpHeaders;");
                        code.line(
                            "this.responseBody = responseBody == null ? null : responseBody.getBytes(StandardCharsets.UTF_8);");
                    });

                block.publicMethod("int getStatusCode()", code -> code.methodReturn("statusCode"));

                block.publicMethod("String getHeaderValue(String s)",
                    code -> code.methodReturn("httpHeaders.getValue(HttpHeaderName.fromString(s))"));

                block.publicMethod("HttpHeaders getHeaders()", code -> code.methodReturn("httpHeaders"));

                block.publicMethod("Flux<ByteBuffer> getBody()",
                    code -> code.methodReturn("Flux.just(ByteBuffer.wrap(responseBody))"));

                block.publicMethod("Mono<byte[]> getBodyAsByteArray()",
                    code -> code.methodReturn("Mono.just(responseBody)"));

                block.publicMethod("Mono<String> getBodyAsString()",
                    code -> code.methodReturn("Mono.just(new String(responseBody, StandardCharsets.UTF_8))"));

                block.publicMethod("Mono<String> getBodyAsString(Charset charset)",
                    code -> code.methodReturn("Mono.just(new String(responseBody, charset))"));
            });
        }
    }
}
