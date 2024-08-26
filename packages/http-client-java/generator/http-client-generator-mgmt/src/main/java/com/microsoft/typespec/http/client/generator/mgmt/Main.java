// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;

public class Main {

    public static void main(String[] args) {
        Connection connection = new Connection(System.out, System.in);
        connection.dispatch("GetPluginNames", () -> "[\"fluentgen\"]");
        connection.dispatch("Process", (plugin, sessionId) -> new FluentGen(connection, plugin, sessionId).process());
        connection.dispatchNotification("Shutdown", connection::stop);

        // wait for something to do.
        connection.waitForAll();
        System.exit(0);
    }
}
