// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.android;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.MethodGroupTemplate;

public class AndroidMethodGroupTemplate extends MethodGroupTemplate {
    private static final MethodGroupTemplate INSTANCE = new AndroidMethodGroupTemplate();

    protected AndroidMethodGroupTemplate() {
    }

    public static MethodGroupTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void writeServiceProxyConstruction(JavaBlock constructor, MethodGroupClient methodGroupClient) {
        ClassType proxyType = ClassType.ANDROID_REST_PROXY;
        constructor.line(String.format(
            "this.service = %1$s.create(%2$s.class, client.getHttpPipeline(), client.getJacksonSerder());",
            proxyType.getName(), methodGroupClient.getProxy().getName()));
    }

    @Override
    protected void writeAdditionalClassBlock(JavaClass classBlock) {
        classBlock.privateStaticFinalClass(
            "ResponseCompletableFuture<T> extends CompletableFuture<Response<T>> implements Callback<Response<T>>",
            embeddedClass -> {
                embeddedClass.annotation("Override");
                embeddedClass.publicMethod("void onSuccess(Response<T> response)", method -> {
                    method.line("this.complete(response);");
                });

                embeddedClass.annotation("Override");
                embeddedClass.publicMethod("void onFailure(Throwable error)", method -> {
                    method.line("this.completeExceptionally(error);");
                });
            });

        classBlock.privateStaticFinalClass(
            "PagedResponseCompletableFuture<P, T> extends CompletableFuture<PagedResponse<T>> implements Callback<Response<P>>",
            embeddedClass -> {
                embeddedClass.privateFinalMemberVariable("Function<Response<P>, PagedResponse<T>>", "converter");
                embeddedClass.constructor(JavaVisibility.PackagePrivate,
                    "PagedResponseCompletableFuture(Function<Response<P>, PagedResponse<T>> converter)",
                    constructorBody -> {
                        constructorBody.line("this.converter = converter;");
                    });
                embeddedClass.annotation("Override");
                embeddedClass.publicMethod("void onSuccess(Response<P> response)",
                    method -> method.line("this.complete(this.converter.apply(response));"));

                embeddedClass.annotation("Override");
                embeddedClass.publicMethod("void onFailure(Throwable error)",
                    method -> method.line("this.completeExceptionally(error);"));
            });
    }
}

