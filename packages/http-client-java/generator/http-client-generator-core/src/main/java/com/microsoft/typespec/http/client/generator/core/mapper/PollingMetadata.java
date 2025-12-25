// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.LongRunningMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PollingSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPollingDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import io.clientcore.core.http.models.HttpMethod;

/**
 * Type that parses and holds long-running polling metadata for an {@link Operation}, and exposes a view of the metadata
 * as {@link MethodPollingDetails}.
 */
final class PollingMetadata {
    private final String pollingStrategy;
    private final String syncPollingStrategy;
    private final IType pollResultType;
    private final IType finalResultType;
    private final int pollIntervalInSeconds;
    private final HttpMethod httpMethod;

    /**
     * Creates long-running polling metadata for an {@link Operation}.
     *
     * @param operation the operation to create the polling metadata for.
     * @param proxyMethod the proxy method representing the long-running proxy api.
     * @param operationResponseType the return type originally derived from the {@code operation} response
     * schema ({@link Operation#getResponseSchemas()}). See 'getResponseBodyType' in
     * {@link ClientMethodsReturnDescription}.
     *
     * @return the polling metadata.
     */
    static PollingMetadata create(Operation operation, ProxyMethod proxyMethod, IType operationResponseType) {
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
                    pollingSettings.getSyncPollingStrategy(), operationResponseType.asNullable(),
                    operationResponseType.asNullable(), pollingSettings.getPollIntervalInSeconds(), httpMethod);
            }

            final IType pollResultType = getPollResultType(pollingSettings, operationResponseType);
            final IType finalResultType;
            if (httpMethod == HttpMethod.DELETE) {
                finalResultType = PrimitiveType.VOID;
            } else {
                finalResultType = getFinalResultType(pollingSettings, operationResponseType);
            }
            return new PollingMetadata(pollingSettings.getPollingStrategy(), pollingSettings.getSyncPollingStrategy(),
                pollResultType, finalResultType, pollingSettings.getPollIntervalInSeconds(), httpMethod);
        } else {
            // Create 'PollingMetadata' from TypeSpec long-running metadata.
            // Note: Only TypeSpec would have 'Operation::LongRunningMetadata' available.
            //
            return create(lroMetadata, pollingSettings, httpMethod);
        }
    }

    /**
     * Gets the view of the polling metadata as {@link MethodPollingDetails}.
     * <p>
     * The resulting {@link MethodPollingDetails} is used for long-running {@link ClientMethod} i.e, client methods of
     * type {@link ClientMethodType#LongRunningBeginSync}, {@link ClientMethodType#LongRunningBeginAsync},
     * {@link ClientMethodType#LongRunningSync} and {@link ClientMethodType#LongRunningAsync}.
     * </p>
     *
     * @return the polling metadata.
     */
    MethodPollingDetails asMethodPollingDetails() {
        return new MethodPollingDetails(pollingStrategy, syncPollingStrategy, pollResultType, finalResultType,
            pollIntervalInSeconds);
    }

    /**
     * Checks whether the poll and final result types are model types (i.e., not {@link ClassType#BINARY_DATA} type).
     *
     * @return true if the poll and final result types are model types, false otherwise.
     */
    boolean hasModelResultTypes() {
        final boolean pollResultTypeUsesModel = !ClassType.BINARY_DATA.equals(pollResultType);
        final boolean finalResultTypeUsesModel
            = !ClassType.BINARY_DATA.equals(finalResultType) && !ClassType.VOID.equals(finalResultType);
        return pollResultTypeUsesModel && finalResultTypeUsesModel;
    }

    /**
     * Gets the view of the polling metadata as {@link MethodPollingDetails} to enable long-running {@link ClientMethod}
     * with {@link ClassType#BINARY_DATA} type for poll and final result.
     * <p>
     * the long-running {@link ClientMethod} are the client methods of type
     * {@link ClientMethodType#LongRunningBeginSync},
     * {@link ClientMethodType#LongRunningBeginAsync}, {@link ClientMethodType#LongRunningSync} and
     * {@link ClientMethodType#LongRunningAsync}.
     * </p>
     *
     * @return the polling metadata.
     */
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

    /**
     * Gets the {@link IType} representing the poll result when the long-running operation is in progress.
     *
     * @param pollingSettings the settings to obtain the poll result.
     * @param operationResponseType the type to use if {@code pollSettings} do not contain the poll result.
     *
     * @return the poll result type.
     */
    private static IType getPollResultType(PollingSettings pollingSettings, IType operationResponseType) {
        final IType pollResultType;
        if (pollingSettings.getPollResultType() != null) {
            pollResultType = createTypeFromModelName(pollingSettings.getPollResultType());
        } else {
            pollResultType = operationResponseType.asNullable();
        }
        if (pollResultType.asNullable() == ClassType.VOID) {
            // azure-core requires poll response to be non-null.
            return ClassType.BINARY_DATA;
        } else {
            return pollResultType;
        }
    }

    /**
     * Gets the {@link IType} representing the final result once the long-running operation is completed.
     *
     * @param pollingSettings the settings to obtain the final result.
     * @param operationResponseType the type to use if {@code pollSettings} do not contain the final result.
     *
     * @return the final result type.
     */
    private static IType getFinalResultType(PollingSettings pollingSettings, IType operationResponseType) {
        final IType finalResultType;
        if (pollingSettings.getFinalResultType() != null) {
            finalResultType = createTypeFromModelName(pollingSettings.getFinalResultType());
        } else {
            finalResultType = operationResponseType.asNullable();
        }
        if (finalResultType.asNullable() == ClassType.VOID) {
            // azure-core requires poll response to be non-null
            return ClassType.BINARY_DATA;
        } else {
            return finalResultType;
        }
    }

    /**
     * create {@link PollingMetadata} from the TypeSpec long-running metadata.
     *
     * @param lroMetadata the long-running metadata from the TypeSpec ({@link Operation#getLroMetadata()}).
     * @param pollingSettings the settings to use in-addition to the {@code lroMetadata}.
     * @param httpMethod the http verb initiating the long-running operation.
     *
     * @return the polling metadata.
     */
    private static PollingMetadata create(LongRunningMetadata lroMetadata, PollingSettings pollingSettings,
        HttpMethod httpMethod) {
        assert pollingSettings != null && lroMetadata != null;

        // Step_1: Resolve LRO poll and final result types.
        //
        final ObjectMapper objectMapper = Mappers.getObjectMapper();
        final IType pollResultType;
        if (pollingSettings.getPollResultType() != null) {
            // For result types, the 'PollingSettings' would take precedence over 'LongRunningMetadata'
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
            final String strategyFqName = packageName + "." + strategyName;
            final String syncStrategyFqName = packageName + "." + "Sync" + strategyName;

            if (lroMetadata.getFinalResultPropertySerializedName() != null) {
                final String finalResultArg
                    = ClassType.STRING.defaultValueExpression(lroMetadata.getFinalResultPropertySerializedName());
                pollingStrategy = String.format(PollingSettings.INSTANTIATE_POLLING_STRATEGY_WITH_RESULT_FORMAT,
                    strategyFqName, finalResultArg);
                syncPollingStrategy = String.format(PollingSettings.INSTANTIATE_POLLING_STRATEGY_WITH_RESULT_FORMAT,
                    syncStrategyFqName, finalResultArg);
            } else {
                pollingStrategy = String.format(PollingSettings.INSTANTIATE_POLLING_STRATEGY_FORMAT, strategyFqName);
                syncPollingStrategy
                    = String.format(PollingSettings.INSTANTIATE_POLLING_STRATEGY_FORMAT, syncStrategyFqName);
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
