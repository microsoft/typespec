// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import com.microsoft.typespec.http.client.generator.TypeSpecPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.azure.json.JsonReader;
import com.azure.json.ReadValueCallback;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;

import java.nio.file.Path;
import java.util.Map;

public class TypeSpecFluentNamer extends FluentNamer {
    private final Map<String, Object> settingsMap;
    private final CodeModel codeModel;
    public TypeSpecFluentNamer(NewPlugin plugin, String pluginName, String sessionId, Map<String, Object> settingsMap, CodeModel codeModel) {
        super(plugin, new TypeSpecPlugin.MockConnection(), pluginName, sessionId);
        this.settingsMap = settingsMap;
        this.codeModel = codeModel;
    }

    @Override
    protected CodeModel getCodeModelAndWriteToTargetFolder(Path codeModelFolder) {
        return this.codeModel;
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValue(String key, ReadValueCallback<String, T> converter) {
        // in case parent class constructor calls this method, e.g. new PluginLogger()
        if (settingsMap == null) {
            return null;
        }
        return (T) settingsMap.get(key);
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValueWithJsonReader(String key, ReadValueCallback<JsonReader, T> converter) {
        // in case parent class constructor calls this method, e.g. new PluginLogger()
        if (settingsMap == null) {
            return null;
        }
        return (T) settingsMap.get(key);
    }
}
