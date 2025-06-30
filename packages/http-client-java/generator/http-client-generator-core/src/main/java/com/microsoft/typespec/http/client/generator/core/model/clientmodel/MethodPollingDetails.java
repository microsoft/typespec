// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

public class MethodPollingDetails {
    private final String pollingStrategy;
    private final String syncPollingStrategy;
    private final IType pollResultType;
    private final IType finalResultType;
    private final int pollIntervalInSeconds;

    public MethodPollingDetails(String pollingStrategy, String syncPollingStrategy, IType pollResultType,
        IType finalResultType, int pollIntervalInSeconds) {
        this.pollingStrategy = pollingStrategy;
        this.syncPollingStrategy = syncPollingStrategy;
        this.pollResultType = pollResultType;
        this.finalResultType = finalResultType;
        this.pollIntervalInSeconds = pollIntervalInSeconds;
    }

    public String getPollingStrategy() {
        return pollingStrategy;
    }

    public String getSyncPollingStrategy() {
        return syncPollingStrategy;
    }

    public IType getPollResultType() {
        return pollResultType;
    }

    public IType getFinalResultType() {
        return finalResultType;
    }

    public int getPollIntervalInSeconds() {
        return pollIntervalInSeconds;
    }
}
