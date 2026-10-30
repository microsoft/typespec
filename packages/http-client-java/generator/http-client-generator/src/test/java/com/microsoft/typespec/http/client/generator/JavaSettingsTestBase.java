// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.DefaultMapperFactory;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.template.DefaultTemplateFactory;
import com.microsoft.typespec.http.client.generator.core.template.Templates;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
@Execution(ExecutionMode.SAME_THREAD)
public abstract class JavaSettingsTestBase {
    @BeforeAll
    public static void initializeJavaSettings() {
        configureJavaSettings(Map.of());
    }

    @AfterEach
    public void resetJavaSettings() {
        configureJavaSettings(Map.of());
    }

    protected static void configureJavaSettings(Map<String, String> settings) {
        JavaSettings.clear();
        JavaSettings.setHost(new TestPlugin(settings));
        Mappers.setFactory(new DefaultMapperFactory());
        Templates.setFactory(new DefaultTemplateFactory());
    }

    protected static final class TestPlugin extends Javagen {
        private final Map<String, String> settings;

        protected TestPlugin(Map<String, String> settings) {
            super(null, "test", "test");
            this.settings = Map.copyOf(settings);
        }

        @Override
        public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
            try {
                return converter.apply(settings == null ? null : settings.get(key));
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }

        @Override
        public <T> T getValueWithJsonReader(String key, IOExceptionCheckedFunction<JsonReader, T> converter) {
            String value = settings == null ? null : settings.get(key);
            if (value == null) {
                return null;
            }
            try (JsonReader reader = JsonReader.fromString(value)) {
                return converter.apply(reader);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }

        @Override
        public void message(Message message) {
        }

        @Override
        public boolean processInternal() {
            throw new UnsupportedOperationException();
        }
    }
}
