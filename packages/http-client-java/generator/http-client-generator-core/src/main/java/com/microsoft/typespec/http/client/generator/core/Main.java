// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core;

import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;

public class Main {

    public static void main(String[] args) {
        Connection connection = new Connection(System.out, System.in);
        connection.dispatch("GetPluginNames", () -> "[\"javagen\"]");
        connection.dispatch("Process", (plugin, sessionId) -> new Javagen(connection, plugin, sessionId).process());
        connection.dispatchNotification("Shutdown", connection::stop);
        connection.waitForAll();
        System.exit(0);
    }
}
