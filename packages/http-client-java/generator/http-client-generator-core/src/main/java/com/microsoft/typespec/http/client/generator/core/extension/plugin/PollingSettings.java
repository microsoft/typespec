// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.plugin;

import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * type representing the user configured polling settings for long-running operations.
 */
public final class PollingSettings implements JsonSerializable<PollingSettings> {
    private String strategy;
    private String syncStrategy;
    private String intermediateType;
    private String finalType;
    private String pollInterval;

    public PollingSettings() {
    }

    /**
     * The default polling strategy format.
     */
    public static final String DEFAULT_POLLING_STRATEGY_FORMAT
        = String.join("\n", "new %s<>(new PollingStrategyOptions({httpPipeline})", "    .setEndpoint({endpoint})",
            "    .setContext({context})", "    .setServiceVersion({serviceVersion}))");

    private static final String DEFAULT_POLLING_CODE
        = String.format(DEFAULT_POLLING_STRATEGY_FORMAT, "DefaultPollingStrategy");

    private static final String DEFAULT_SYNC_POLLING_CODE
        = String.format(DEFAULT_POLLING_STRATEGY_FORMAT, "SyncDefaultPollingStrategy");

    /**
     * Gets the strategy for polling.
     * <p>
     * See the 'com.azure.core.util.polling.PollingStrategy' contract for more details.
     * </p>
     *
     * @return The strategy for polling.
     */
    public String getStrategy() {
        if (strategy == null || "default".equalsIgnoreCase(strategy)) {
            return DEFAULT_POLLING_CODE;
        } else {
            return strategy;
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
    public String getSyncStrategy() {
        if (syncStrategy == null || "default".equalsIgnoreCase(syncStrategy)) {
            return DEFAULT_SYNC_POLLING_CODE;
        } else {
            return syncStrategy;
        }
    }

    /**
     * Gets the type of the poll response when the long-running operation is in progress.
     *
     * @return The intermediate type for polling.
     */
    public String getIntermediateType() {
        return intermediateType;
    }

    /**
     * Gets the type of the poll response once the long-running operation is completed.
     *
     * @return The final type for polling.
     */
    public String getFinalType() {
        return finalType;
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
            .writeStringField("strategy", strategy)
            .writeStringField("sync-strategy", syncStrategy)
            .writeStringField("intermediate-type", intermediateType)
            .writeStringField("final-type", finalType)
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
                    pollingSettings.strategy = reader.getString();
                } else if ("sync-strategy".equals(fieldName)) {
                    pollingSettings.syncStrategy = reader.getString();
                } else if ("intermediate-type".equals(fieldName)) {
                    pollingSettings.intermediateType = reader.getString();
                } else if ("final-type".equals(fieldName)) {
                    pollingSettings.finalType = reader.getString();
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
