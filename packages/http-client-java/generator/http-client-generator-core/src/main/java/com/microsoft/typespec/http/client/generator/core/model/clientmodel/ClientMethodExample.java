// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

public class ClientMethodExample {
    private final ClientMethod clientMethod;

    private final AsyncSyncClient syncClient;

    private final ClientBuilder clientBuilder;

    private final String filename;

    private final ProxyMethodExample proxyMethodExample;

    public ClientMethodExample(
            ClientMethod clientMethod,
            AsyncSyncClient syncClient,
            ClientBuilder clientBuilder,
            String filename,
            ProxyMethodExample proxyMethodExample) {
        this.clientMethod = clientMethod;
        this.syncClient = syncClient;
        this.clientBuilder = clientBuilder;
        this.filename = filename;
        this.proxyMethodExample = proxyMethodExample;
    }

    public ClientMethod getClientMethod() {
        return clientMethod;
    }

    public AsyncSyncClient getSyncClient() {
        return syncClient;
    }

    public ClientBuilder getClientBuilder() {
        return clientBuilder;
    }

    public String getFilename() {
        return filename;
    }

    public ProxyMethodExample getProxyMethodExample() {
        return proxyMethodExample;
    }
}
