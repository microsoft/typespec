// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest;

import com.azure.autorest.extension.base.jsonrpc.Connection;

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
