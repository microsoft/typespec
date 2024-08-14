// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

public class ProtocolExample {

    private final ClientMethod clientMethod;

    private final AsyncSyncClient syncClient;

    private final ClientBuilder clientBuilder;

    private final String filename;

    private final ProxyMethodExample proxyMethodExample;

    public ProtocolExample(
            ClientMethod clientMethod,
            AsyncSyncClient client,
            ClientBuilder clientBuilder,
            String filename,
            ProxyMethodExample proxyMethodExample) {
        this.clientMethod = clientMethod;
        this.syncClient = client;
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
