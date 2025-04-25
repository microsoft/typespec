// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.http.HttpMethod;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.LongRunningMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PollingSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPollingDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;

/**
 * Type that holds polling information resolved for an {@link Operation}, and exposes a view of the metadata as
 * {@link MethodPollingDetails}.
 */
final class PollingMetadata {
    private final String pollingStrategy;
    private final String syncPollingStrategy;
    private final IType pollResultType;
    private final IType finalResultType;
    private final int pollIntervalInSeconds;
    private final HttpMethod httpMethod;

    static PollingMetadata create(Operation operation, ProxyMethod proxyMethod, IType syncReturnType) {
        final JavaSettings settings = JavaSettings.getInstance();
        final PollingSettings pollingSettings = settings.getPollingSettings(proxyMethod.getOperationId());

        if (pollingSettings == null) {
            return null;
        }

        final HttpMethod httpMethod = MethodUtil.getHttpMethod(operation);
        final LongRunningMetadata lroMetadata = operation.getLroMetadata();
        if (lroMetadata == null || operation.getConvenienceApi() == null) {
            // Create 'PollingMetadata' from 'PollingSettings'.
            //
            if (settings.isFluent()) {
                return new PollingMetadata(pollingSettings.getPollingStrategy(),
                    pollingSettings.getSyncPollingStrategy(), syncReturnType.asNullable(), syncReturnType.asNullable(),
                    pollingSettings.getPollIntervalInSeconds(), httpMethod);
            }

            final IType pollResultType = getPollResultType(pollingSettings, syncReturnType);
            final IType finalResultType;
            if (httpMethod == HttpMethod.DELETE) {
                finalResultType = PrimitiveType.VOID;
            } else {
                finalResultType = getFinalResultType(pollingSettings, syncReturnType);
            }
            return new PollingMetadata(pollingSettings.getPollingStrategy(), pollingSettings.getSyncPollingStrategy(),
                pollResultType, finalResultType, pollingSettings.getPollIntervalInSeconds(), httpMethod);
        } else {
            // Create 'PollingMetadata' from TypeSpec long-running metadata.
            // Note: Only TypeSpec would have 'Operation::LongRunningMetadata' available.
            //
            return create(pollingSettings, lroMetadata, httpMethod);
        }
    }

    MethodPollingDetails asMethodPollingDetails() {
        return new MethodPollingDetails(pollingStrategy, syncPollingStrategy, pollResultType, finalResultType,
            pollIntervalInSeconds);
    }

    boolean hasBinaryDataResultTypes() {
        if (ClassType.BINARY_DATA.equals(pollResultType)) {
            return ClassType.BINARY_DATA.equals(finalResultType) || ClassType.VOID.equals(finalResultType.asNullable());
        }
        return false;
    }

    MethodPollingDetails asMethodPollingDetailsForBinaryDataResult() {
        final IType pollResultType = ClassType.BINARY_DATA;
        final IType finalResultType;
        if (httpMethod == HttpMethod.DELETE) {
            finalResultType = PrimitiveType.VOID;
        } else {
            finalResultType = ClassType.BINARY_DATA;
        }
        return new MethodPollingDetails(pollingStrategy, syncPollingStrategy, pollResultType, finalResultType,
            pollIntervalInSeconds);
    }

    private static IType getPollResultType(PollingSettings pollingSettings, IType syncReturnType) {
        final IType pollResultType;
        if (pollingSettings.getPollResultType() != null) {
            pollResultType = createTypeFromModelName(pollingSettings.getPollResultType());
        } else {
            pollResultType = syncReturnType.asNullable();
        }
        if (pollResultType.asNullable() == ClassType.VOID) {
            // azure-core requires poll response to be non-null.
            return ClassType.BINARY_DATA;
        } else {
            return pollResultType;
        }
    }

    private static IType getFinalResultType(PollingSettings pollingSettings, IType syncReturnType) {
        final IType finalResultType;
        if (pollingSettings.getFinalResultType() != null) {
            finalResultType = createTypeFromModelName(pollingSettings.getFinalResultType());
        } else {
            finalResultType = syncReturnType.asNullable();
        }
        if (finalResultType.asNullable() == ClassType.VOID) {
            // azure-core requires poll response to be non-null
            return ClassType.BINARY_DATA;
        } else {
            return finalResultType;
        }
    }

    private static PollingMetadata create(PollingSettings pollingSettings, LongRunningMetadata lroMetadata,
        HttpMethod httpMethod) {
        assert pollingSettings != null && lroMetadata != null;

        // Step_1: Resolve LRO poll and final result types.
        //
        final ObjectMapper objectMapper = Mappers.getObjectMapper();
        final IType pollResultType;
        if (pollingSettings.getPollResultType() != null) {
            // pollingSettings would take precedence over 'LongRunningMetadata'
            pollResultType = createTypeFromModelName(pollingSettings.getPollResultType());
        } else {
            pollResultType = objectMapper.map(lroMetadata.getPollResultType());
        }

        final IType finalResultType;
        if (pollingSettings.getFinalResultType() != null) {
            finalResultType = createTypeFromModelName(pollingSettings.getFinalResultType());
        } else {
            if (lroMetadata.getFinalResultType() == null) {
                finalResultType = PrimitiveType.VOID;
            } else {
                finalResultType = objectMapper.map(lroMetadata.getFinalResultType());
            }
        }

        // Step_2: Resolve LRO poll strategy.
        //
        final String pollingStrategy;
        final String syncPollingStrategy;
        final JavaSettings settings = JavaSettings.getInstance();
        final String packageName = settings.getPackage(settings.getImplementationSubpackage());
        if (lroMetadata.getPollingStrategy() != null) {
            final String strategyName = lroMetadata.getPollingStrategy().getLanguage().getJava().getName();
            final String strategyFqdnName = packageName + "." + strategyName;
            final String syncStrategyFqdnName = packageName + "." + "Sync" + strategyName;

            if (lroMetadata.getFinalResultPropertySerializedName() != null) {
                final String finalResultArg
                    = ClassType.STRING.defaultValueExpression(lroMetadata.getFinalResultPropertySerializedName());
                pollingStrategy = String.format(PollingSettings.INSTANTIATE_POLLING_STRATEGY_WITH_RESULT_FORMAT,
                    strategyFqdnName, finalResultArg);
                syncPollingStrategy = String.format(PollingSettings.INSTANTIATE_POLLING_STRATEGY_WITH_RESULT_FORMAT,
                    syncStrategyFqdnName, finalResultArg);
            } else {
                pollingStrategy = String.format(PollingSettings.INSTANTIATE_POLLING_STRATEGY_FORMAT, strategyFqdnName);
                syncPollingStrategy
                    = String.format(PollingSettings.INSTANTIATE_POLLING_STRATEGY_FORMAT, syncStrategyFqdnName);
            }
        } else {
            pollingStrategy = pollingSettings.getPollingStrategy();
            syncPollingStrategy = pollingSettings.getSyncPollingStrategy();
        }

        return new PollingMetadata(pollingStrategy, syncPollingStrategy, pollResultType, finalResultType,
            pollingSettings.getPollIntervalInSeconds(), httpMethod);
    }

    private static IType createTypeFromModelName(String modelName) {
        final String className;
        final String packageName;
        final int lastDotIndex = modelName.lastIndexOf('.');
        if (lastDotIndex >= 0) {
            // model-name is a fully qualified name, extract class and package name from it.
            className = modelName.substring(lastDotIndex + 1);
            packageName = modelName.substring(0, lastDotIndex);
        } else {
            // model-name is a simple name, use package name from JavaSettings.
            className = modelName;
            packageName = JavaSettings.getInstance().getPackage();
        }
        return new ClassType.Builder().packageName(packageName).name(className).build();
    }

    private PollingMetadata(String pollingStrategy, String syncPollingStrategy, IType pollResultType,
        IType finalResultType, int pollIntervalInSeconds, HttpMethod httpMethod) {
        this.pollResultType = pollResultType;
        this.finalResultType = finalResultType;
        this.pollingStrategy = pollingStrategy;
        this.syncPollingStrategy = syncPollingStrategy;
        this.pollIntervalInSeconds = pollIntervalInSeconds;
        this.httpMethod = httpMethod;
    }
}
