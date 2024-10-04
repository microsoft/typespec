// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import com.azure.json.JsonReader;
import com.azure.json.ReadValueCallback;
import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import java.util.HashMap;
import java.util.Map;

public class MockJavagen extends Javagen {

    private static final Map<String, Object> DEFAULT_SETTINGS = new HashMap<>();

    public MockJavagen(Connection connection) {
        super(connection, "dummy", "dummy");
        instance = this;
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValue(String key, ReadValueCallback<String, T> converter) {
        return (T) DEFAULT_SETTINGS.get(key);
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValueWithJsonReader(String key, ReadValueCallback<JsonReader, T> converter) {
        return (T) DEFAULT_SETTINGS.get(key);
    }

    @Override
    public void message(Message message) {
    }
}
