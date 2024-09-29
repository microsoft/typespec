// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core;

import com.azure.json.JsonReader;
import com.azure.json.ReadValueCallback;
import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class MockUnitJavagen extends Javagen {

    private static final Map<String, Object> SETTINGS_MAP = new HashMap<>();
    static {
        SETTINGS_MAP.put("namespace", "com.azure.mock");
    }

    public static class MockConnection extends Connection {

        public MockConnection() {
            super(null, null);
        }
    }

    public MockUnitJavagen() {
        super(new MockConnection(), "dummy", "dummy");
        JavaSettingsAccessor.setHost(this);
    }

    @Override
    public String readFile(String fileName) {
        InputStream fis = this.getClass().getClassLoader().getResourceAsStream(fileName);
        StringBuilder sb = new StringBuilder();
        char[] buffer = new char[1024];
        try (InputStreamReader reader = new InputStreamReader(fis, StandardCharsets.UTF_8)) {
            int charsRead;
            while ((charsRead = reader.read(buffer, 0, buffer.length)) > 0) {
                sb.append(buffer, 0, charsRead);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValue(String key, ReadValueCallback<String, T> converter) {
        return (T) SETTINGS_MAP.get(key);
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValueWithJsonReader(String key, ReadValueCallback<JsonReader, T> converter) {
        return (T) SETTINGS_MAP.get(key);
    }

    @Override
    public void message(Message message) {
    }
}
