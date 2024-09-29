// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import com.azure.json.JsonReader;
import com.azure.json.ReadValueCallback;
import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettingsAccessor;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TestUtils {

    public static class MockConnection extends Connection {

        public MockConnection() {
            super(null, null);
        }
    }

    public static class MockFluentGen extends FluentGen {

        private static final Map<String, Object> DEFAULT_SETTINGS = new HashMap<>();
        static {
            DEFAULT_SETTINGS.put("namespace", "com.azure.resourcemanager.mock");
            DEFAULT_SETTINGS.put("fluent", "lite");
            DEFAULT_SETTINGS.put("sync-methods", "all");
            DEFAULT_SETTINGS.put("client-side-validations", true);
            DEFAULT_SETTINGS.put("client-logger", true);
            DEFAULT_SETTINGS.put("generate-client-interfaces", true);
            DEFAULT_SETTINGS.put("required-parameter-client-methods", true);
            DEFAULT_SETTINGS.put("generate-samples", true);
            DEFAULT_SETTINGS.put("generate-tests", true);
            DEFAULT_SETTINGS.put("client-flattened-annotation-target", "NONE");
        }

        private Javagen javagen;

        public MockFluentGen() {
            super(new MockConnection(), "dummy", "dummy");
            instance = this;

            JavaSettingsAccessor.setHost(this);

            FluentStatic.setFluentJavaSettings(new FluentJavaSettings(this));

            javagen = new MockJavagen(this.connection);
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
//            System.out.println(String.format("[%1$s] %2$s", message.getChannel(), message.getText()));
        }

        @Override
        public void writeFile(String fileName, String content, List<Object> sourceMap) {
        }
    }
}
