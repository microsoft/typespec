// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

/**
 * A collection of templates for writing JV models to Java files and contexts.
 */
public class Templates {

    private static TemplateFactory factory = new DefaultTemplateFactory();

    public static void setFactory(TemplateFactory templateFactory) {
        factory = templateFactory;
    }

    public static ServiceClientInterfaceTemplate getServiceClientInterfaceTemplate() {
        return factory.getServiceClientInterfaceTemplate();
    }

    public static ServiceClientTemplate getServiceClientTemplate() {
        return factory.getServiceClientTemplate();
    }

    public static ServiceClientBuilderTemplate getServiceClientBuilderTemplate() {
        return factory.getServiceClientBuilderTemplate();
    }

    public static ServiceVersionTemplate getServiceVersionTemplate() {
        return factory.getServiceVersionTemplate();
    }

    public static MethodGroupInterfaceTemplate getMethodGroupInterfaceTemplate() {
        return factory.getMethodGroupInterfaceTemplate();
    }

    public static MethodGroupTemplate getMethodGroupTemplate() {
        return factory.getMethodGroupTemplate();
    }

    public static ProxyTemplate getProxyTemplate() {
        return factory.getProxyTemplate();
    }

    public static ClientMethodTemplate getClientMethodTemplate() {
        return factory.getClientMethodTemplate();
    }

    public static ModelTemplate getModelTemplate() {
        return factory.getModelTemplate();
    }

    public static StreamSerializationModelTemplate getStreamStyleModelTemplate() {
        return factory.getStreamStyleModelTemplate();
    }

    public static ExceptionTemplate getExceptionTemplate() {
        return factory.getExceptionTemplate();
    }

    public static EnumTemplate getEnumTemplate() {
        return factory.getEnumTemplate();
    }

    public static ResponseTemplate getResponseTemplate() {
        return factory.getResponseTemplate();
    }

    public static XmlSequenceWrapperTemplate getXmlSequenceWrapperTemplate() {
        return factory.getXmlSequenceWrapperTemplate();
    }

    public static PackageInfoTemplate getPackageInfoTemplate() {
        return factory.getPackageInfoTemplate();
    }

    public static ServiceAsyncClientTemplate getServiceAsyncClientTemplate() {
        return factory.getServiceAsyncClientTemplate();
    }

    public static WrapperClientMethodTemplate getWrapperClientMethodTemplate() {
        return factory.getWrapperClientMethodTemplate();
    }

    public static ServiceSyncClientTemplate getServiceSyncClientTemplate() {
        return factory.getServiceSynClientTemplate();
    }

    public static ServiceSyncClientTemplate getServiceSyncClientWrapAsyncClientTemplate() {
        return factory.getServiceSyncClientWrapAsyncClientTemplate();
    }

    public static PomTemplate getPomTemplate() {
        return factory.getPomTemplate();
    }

    public static ModuleInfoTemplate getModuleInfoTemplate() {
        return factory.getModuleInfoTemplate();
    }

    public static ProtocolSampleTemplate getProtocolSampleTemplate() {
        return factory.getProtocolSampleTemplate();
    }

    public static ConvenienceAsyncMethodTemplate getConvenienceAsyncMethodTemplate() {
        return factory.getConvenienceAsyncMethodTemplate();
    }

    public static ConvenienceSyncMethodTemplate getConvenienceSyncMethodTemplate() {
        return factory.getConvenienceSyncMethodTemplate();
    }

    public static UnionModelTemplate getUnionModelTemplate() {
        return factory.getUnionModelTemplate();
    }

    public static ClientMethodSampleTemplate getClientMethodSampleTemplate() {
        return factory.getClientMethodSampleTemplate();
    }

    public static JsonMergePatchHelperTemplate getJsonMergePatchHelperTemplate() {
        return factory.getJsonMergePatchHelperTemplate();
    }
}
