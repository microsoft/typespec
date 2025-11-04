// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.plugin;

import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * type representing the user configured polling settings for long-running operations.
 * <a href="https://github.com/Azure/autorest.java?tab=readme-ov-file#polling-configuration">Configure Polling
 * Settings</a>
 */
public final class PollingSettings implements JsonSerializable<PollingSettings> {
    private String pollingStrategy;
    private String syncPollingStrategy;
    private String pollResultType;
    private String finalResultType;
    private String pollInterval;

    public PollingSettings() {
    }

    /**
     * The format of the java source code to instantiate a polling strategy class with PollingStrategyOptions argument.
     * For example, in case of the strategy 'OperationLocationPollingStrategy' class, the code after applying the format
     * looks like -
     * new OperationLocationPollingStrategy(new PollingStrategyOptions(...));
     */
    public static final String INSTANTIATE_POLLING_STRATEGY_FORMAT;

    /**
     * The format of the java source code to instantiate a polling strategy class with PollingStrategyOptions and LRO
     * final result arguments. For example, in case of the strategy 'OperationLocationPollingStrategy' class, the code
     * after applying the format looks like -
     * new OperationLocationPollingStrategy(new PollingStrategyOptions(...), finalResultType);
     */
    public static final String INSTANTIATE_POLLING_STRATEGY_WITH_RESULT_FORMAT;
    private static final String INSTANTIATE_DEFAULT_POLLING_STRATEGY;
    private static final String INSTANTIATE_DEFAULT_SYNC_POLLING_STRATEGY;

    static {
        final String[] ctrOptionsArg = {
            "new PollingStrategyOptions({httpPipeline})",
            "    .setEndpoint({endpoint})",
            "    .setContext({context})",
            "    .setServiceVersion({serviceVersion})" };
        INSTANTIATE_POLLING_STRATEGY_FORMAT = "new %s<>" + "(" + String.join("\n", ctrOptionsArg) + ")";

        final String[] ctrOptionsAndFinalResultArg = {
            "new PollingStrategyOptions({httpPipeline})",
            "    .setEndpoint({endpoint})",
            "    .setContext({context})",
            "    .setServiceVersion({serviceVersion}), %s" };
        INSTANTIATE_POLLING_STRATEGY_WITH_RESULT_FORMAT
            = "new %s<>" + "(" + String.join("\n", ctrOptionsAndFinalResultArg) + ")";

        INSTANTIATE_DEFAULT_POLLING_STRATEGY
            = String.format(INSTANTIATE_POLLING_STRATEGY_FORMAT, "DefaultPollingStrategy");
        INSTANTIATE_DEFAULT_SYNC_POLLING_STRATEGY
            = String.format(INSTANTIATE_POLLING_STRATEGY_FORMAT, "SyncDefaultPollingStrategy");
    }

    public static final String DEFAULT_CLIENTCORE_POLLING_STRATEGY_FORMAT
        = String.join("\n", "new %s<>(new PollingStrategyOptions({httpPipeline})", "    .setEndpoint({endpoint})",
            "    .setRequestContext({context})", "    .setServiceVersion({serviceVersion}))");

    private static final String DEFAULT_CLIENTCORE_POLLING_CODE
        = String.format(DEFAULT_CLIENTCORE_POLLING_STRATEGY_FORMAT, "DefaultPollingStrategy");

    /**
     * Gets the strategy for polling.
     * <p>
     * See the 'com.azure.core.util.polling.PollingStrategy' contract for more details.
     * </p>
     *
     * @return The strategy for polling.
     */
    public String getPollingStrategy() {
        if (pollingStrategy == null || "default".equalsIgnoreCase(pollingStrategy)) {
            return INSTANTIATE_DEFAULT_POLLING_STRATEGY;
        } else {
            return pollingStrategy;
        }
    }

    /**
     * Gets the sync strategy for polling.
     * <p>
     * See the 'com.azure.core.util.polling.PollingStrategy' contract for more details.
     * </p>
     *
     * @return The sync strategy for polling.
     */
    public String getSyncPollingStrategy() {
        if (syncPollingStrategy == null || "default".equalsIgnoreCase(syncPollingStrategy)) {
            if (JavaSettings.getInstance().isAzureV2()) {
                return DEFAULT_CLIENTCORE_POLLING_CODE;
            }
            return INSTANTIATE_DEFAULT_SYNC_POLLING_STRATEGY;
        } else {
            return syncPollingStrategy;
        }
    }

    /**
     * Gets the type of the poll response when the long-running operation is in progress.
     *
     * @return The intermediate type for polling.
     */
    public String getPollResultType() {
        return pollResultType;
    }

    /**
     * Gets the type of the poll response once the long-running operation is completed.
     *
     * @return The final type for polling.
     */
    public String getFinalResultType() {
        return finalResultType;
    }

    /**
     * Gets the polling interval in seconds.
     *
     * @return The polling interval in seconds.
     */
    public int getPollIntervalInSeconds() {
        return pollInterval != null ? Integer.parseInt(pollInterval) : 1;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("strategy", pollingStrategy)
            .writeStringField("sync-strategy", syncPollingStrategy)
            .writeStringField("intermediate-type", pollResultType)
            .writeStringField("final-type", finalResultType)
            .writeStringField("poll-interval", pollInterval)
            .writeEndObject();
    }

    /**
     * Deserializes a PollingSettings instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A PollingSettings instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static PollingSettings fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            final PollingSettings pollingSettings = new PollingSettings();

            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("strategy".equals(fieldName)) {
                    pollingSettings.pollingStrategy = reader.getString();
                } else if ("sync-strategy".equals(fieldName)) {
                    pollingSettings.syncPollingStrategy = reader.getString();
                } else if ("intermediate-type".equals(fieldName)) {
                    pollingSettings.pollResultType = reader.getString();
                } else if ("final-type".equals(fieldName)) {
                    pollingSettings.finalResultType = reader.getString();
                } else if ("poll-interval".equals(fieldName)) {
                    pollingSettings.pollInterval = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }

            return pollingSettings;
        });
    }
}
