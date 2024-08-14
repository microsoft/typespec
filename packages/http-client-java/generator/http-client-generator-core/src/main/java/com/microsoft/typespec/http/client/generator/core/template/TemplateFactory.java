// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

public interface TemplateFactory {

    ServiceClientInterfaceTemplate getServiceClientInterfaceTemplate();

    ServiceClientTemplate getServiceClientTemplate();

    ServiceClientBuilderTemplate getServiceClientBuilderTemplate();

    ServiceVersionTemplate getServiceVersionTemplate();

    MethodGroupInterfaceTemplate getMethodGroupInterfaceTemplate();

    MethodGroupTemplate getMethodGroupTemplate();

    ProxyTemplate getProxyTemplate();

    ClientMethodTemplate getClientMethodTemplate();

    ModelTemplate getModelTemplate();

    StreamSerializationModelTemplate getStreamStyleModelTemplate();

    ExceptionTemplate getExceptionTemplate();

    EnumTemplate getEnumTemplate();

    ResponseTemplate getResponseTemplate();

    XmlSequenceWrapperTemplate getXmlSequenceWrapperTemplate();

    PackageInfoTemplate getPackageInfoTemplate();

    ServiceAsyncClientTemplate getServiceAsyncClientTemplate();

    ServiceSyncClientTemplate getServiceSynClientTemplate();

    ServiceSyncClientTemplate getServiceSyncClientWrapAsyncClientTemplate();

    WrapperClientMethodTemplate getWrapperClientMethodTemplate();

    PomTemplate getPomTemplate();

    ModuleInfoTemplate getModuleInfoTemplate();

    ProtocolSampleTemplate getProtocolSampleTemplate();

    ConvenienceAsyncMethodTemplate getConvenienceAsyncMethodTemplate();

    ConvenienceSyncMethodTemplate getConvenienceSyncMethodTemplate();

    UnionModelTemplate getUnionModelTemplate();

    ClientMethodSampleTemplate getClientMethodSampleTemplate();

    JsonMergePatchHelperTemplate getJsonMergePatchHelperTemplate();
}
