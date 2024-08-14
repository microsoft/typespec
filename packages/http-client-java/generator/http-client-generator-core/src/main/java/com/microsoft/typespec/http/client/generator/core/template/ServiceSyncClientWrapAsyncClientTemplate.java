// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;

import java.util.List;
import java.util.stream.Collectors;

public class ServiceSyncClientWrapAsyncClientTemplate extends ServiceSyncClientTemplate {

    private static final ServiceSyncClientTemplate INSTANCE = new ServiceSyncClientWrapAsyncClientTemplate();

    public static ServiceSyncClientTemplate getInstance() {
        return INSTANCE;
    }

    private static final String ASYNC_CLIENT_VAR_NAME = "client";

    @Override
    protected void writeClass(AsyncSyncClient syncClient, JavaClass classBlock, JavaVisibility constructorVisibility) {
        // class variable
        String asyncClassName = ClientModelUtil.clientNameToAsyncClientName(syncClient.getClassName());

        addGeneratedAnnotation(classBlock);
        classBlock.privateFinalMemberVariable(asyncClassName, ASYNC_CLIENT_VAR_NAME);

        // constructor
        classBlock.javadocComment(comment -> {
            comment.description(String.format("Initializes an instance of %1$s class.", syncClient.getClassName()));
            comment.param(ASYNC_CLIENT_VAR_NAME, "the async client.");
        });
        addGeneratedAnnotation(classBlock);
        classBlock.constructor(constructorVisibility, String.format("%1$s(%2$s %3$s)", syncClient.getClassName(),
                asyncClassName, ASYNC_CLIENT_VAR_NAME), constructorBlock -> {
            constructorBlock.line(String.format("this.%1$s = %1$s;", ASYNC_CLIENT_VAR_NAME));
        });

        // methods
        writeMethods(syncClient, classBlock);
    }

    protected String clientReference() {
        return "this." + ASYNC_CLIENT_VAR_NAME;
    }

    @Override
    protected void writeMethod(ClientMethod clientMethod, JavaClass classBlock) {
        METHOD_TEMPLATE_INSTANCE.write(clientMethod, classBlock);
    }

    private static final WrapperClientMethodTemplate METHOD_TEMPLATE_INSTANCE = new ClientMethodTemplateImpl();

    private static class ClientMethodTemplateImpl extends WrapperClientMethodTemplate {

        private String clientReference() {
            return "this." + ASYNC_CLIENT_VAR_NAME;
        }

        @Override
        protected void writeMethodInvocation(ClientMethod clientMethod, JavaBlock function, boolean shouldReturn) {
            List<String> parameterNames = clientMethod.getMethodInputParameters().stream()
                    .map(ClientMethodParameter::getName).collect(Collectors.toList());

            String methodInvoke = String.format("%1$s.%2$s(%3$s)",
                    this.clientReference(), clientMethod.getName(), String.join(", ", parameterNames));
            switch (clientMethod.getType()) {
                case PagingSync:
                    methodInvoke = "new PagedIterable<>(" + methodInvoke + ")";
                    break;

                case LongRunningBeginSync:
                    methodInvoke = methodInvoke + ".getSyncPoller()";
                    break;

                case SendRequestSync:
                    parameterNames.remove("context");
                    methodInvoke = String.format("%1$s.%2$s(%3$s)",
                            this.clientReference(), clientMethod.getName(), String.join(", ", parameterNames));
                    methodInvoke = methodInvoke + ".contextWrite(c -> c.putAll(FluxUtil.toReactorContext(context).readOnly())).block()";
                    break;

                default:
                    methodInvoke = methodInvoke + ".block()";
                    break;
            }

            function.line((shouldReturn ? "return " : "") + methodInvoke + ";");
        }
    }
}
