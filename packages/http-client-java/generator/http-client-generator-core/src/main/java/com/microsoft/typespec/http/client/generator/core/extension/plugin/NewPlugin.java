// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.plugin;

import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.model.MessageChannel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnnotatedPropertyUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModelCustomConstructor;
import com.azure.json.JsonProviders;
import com.azure.json.JsonReader;
import com.azure.json.ReadValueCallback;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;
import org.yaml.snakeyaml.inspector.TrustedTagInspector;
import org.yaml.snakeyaml.representer.Representer;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.UncheckedIOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Represents a plugin that can be run by AutoRest.
 */
public abstract class NewPlugin {
    /**
     * The Yaml used to serialize and deserialize YAML.
     */
    protected final Yaml yamlMapper;

    /**
     * The connection to the AutoRest extension.
     */
    protected final Connection connection;

    /**
     * The name of the plugin.
     */
    protected final String pluginName;

    /**
     * The session id.
     */
    protected final String sessionId;

    /**
     * Reads the content of a file.
     *
     * @param fileName The name of the file.
     * @return The content of the file.
     */
    public String readFile(String fileName) {
        return connection.request("ReadFile", sessionId, fileName);
    }

    /**
     * Gets the value of a key.
     *
     * @param <T> The type of the value.
     * @param key The key.
     * @param converter The converter to convert the value to the desired type.
     * @return The value of the key.
     */
    public <T> T getValue(String key, ReadValueCallback<String, T> converter) {
        try {
            return converter.read(getValueString(key));
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    /**
     * Gets the value of a key as a JSON object.
     *
     * @param key The key.
     * @param converter The converter to convert the value to the desired type.
     * @return The value of the key.
     * @param <T> The type of the value.
     */
    public <T> T getValueWithJsonReader(String key, ReadValueCallback<JsonReader, T> converter) {
        String valueString = getValueString(key);
        if (valueString == null) {
            return null;
        }

        try (JsonReader jsonReader = JsonProviders.createReader(valueString)) {
            return converter.read(jsonReader);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private String getValueString(String key) {
        return connection.request("GetValue", sessionId, key);
    }

    /**
     * Gets the value of a key.
     *
     * @param key The key.
     * @return The value of the key.
     */
    public String getStringValue(String key) {
        return getValue(key, json -> json);
    }

    /**
     * Gets the value of a key.
     *
     * @param key The key.
     * @param defaultValue The default value if the key doesn't have a value.
     * @return The value of the key.
     */
    public String getStringValue(String key, String defaultValue) {
        String ret = getStringValue(key);
        return (ret == null) ? defaultValue : ret;
    }

    /**
     * Gets the value of a key.
     *
     * @param key The key.
     * @return The value of the key.
     */
    public Boolean getBooleanValue(String key) {
        return getValue(key,
            json -> json == null ? null : (!json.equals("0") && !json.equals("false") && !json.isEmpty()));
    }

    /**
     * Gets the value of a key.
     *
     * @param key The key.
     * @param defaultValue The default value if the key doesn't have a value.
     * @return The value of the key.
     */
    public boolean getBooleanValue(String key, boolean defaultValue) {
        Boolean ret = getBooleanValue(key);
        return (ret == null) ? defaultValue : ret;
    }

    /**
     * Gets the input files.
     *
     * @return The input files.
     */
    public List<String> listInputs() {
        return listInputs(null);
    }

    /**
     * Gets the input files of a specific type.
     *
     * @param artifactType The type of the input files.
     * @return The input files of the specific type.
     */
    public List<String> listInputs(String artifactType) {
        String jsonResponse = connection.request("ListInputs", sessionId, artifactType);
        try (JsonReader jsonReader = JsonProviders.createReader(jsonResponse)) {
            return jsonReader.readArray(JsonReader::getString);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    /**
     * Sends a message to the AutoRest extension.
     *
     * @param message The message to send.
     */
    public void message(Message message) {
        connection.notify("Message", sessionId, message);
    }

    /**
     * Sends a message to the AutoRest extension.
     *
     * @param channel The channel of the message.
     * @param text The text of the message.
     * @param error The error of the message.
     * @param keys The keys of the message.
     */
    public void message(MessageChannel channel, String text, Throwable error, List<String> keys) {
        Message message = new Message();
        message.setChannel(channel);
        message.setKey(keys);
        message.setSource(Collections.emptyList());
        if (error != null) {
            text += "\n" + formatThrowableMessage(error);
        }
        message.setText(text);
        message(message);
    }

    /**
     * Writes the content to a file.
     *
     * @param fileName The name of the file.
     * @param content The content of the file.
     * @param sourceMap The source map of the file.
     */
    public void writeFile(String fileName, String content, List<Object> sourceMap) {
        connection.notify("WriteFile", sessionId, fileName, content, sourceMap);
    }

    /**
     * Writes the content to a file.
     *
     * @param fileName The name of the file.
     * @param content The content of the file.
     * @param sourceMap The source map of the file.
     * @param artifactType The type of the file.
     */
    public void writeFile(String fileName, String content, List<Object> sourceMap, String artifactType) {
        Message message = new Message();
        message.setChannel(MessageChannel.FILE);
        if (sourceMap == null) {
            message.setDetails(Map.of("content", content, "type", artifactType, "uri", fileName));
        } else {
            message.setDetails(
                Map.of("content", content, "type", artifactType, "uri", fileName, "sourceMap", sourceMap));
        }
        message.setText(content);
        message.setKey(Arrays.asList(artifactType, fileName));
        connection.notify("Message", sessionId, message);
    }

    /**
     * Protects the files from being overwritten.
     *
     * @param path The path to the files to protect.
     */
    public void protectFiles(String path) {
        List<String> items = listInputs(path);
        if (items != null && !items.isEmpty()) {
            for (String item : items) {
                String content = readFile(item);
                writeFile(item, content, null, "preserved-files");
            }
        }
        String contentSingle = readFile(path);
        writeFile(path, contentSingle, null, "preserved-files");
    }

    /**
     * Gets the configuration file.
     *
     * @param fileName The name of the configuration file.
     * @return The content of the configuration file.
     */
    public String getConfigurationFile(String fileName) {
        Map<String, String> configurations = getValueWithJsonReader("configurationFiles",
            jsonReader -> jsonReader.readMap(JsonReader::getString));

        if (configurations != null) {
            Iterator<String> it = configurations.keySet().iterator();
            if (it.hasNext()) {
                String first = it.next();
                first = first.substring(0, first.lastIndexOf('/'));
                for (String configFile : configurations.keySet()) {
                    if (Objects.equals(configFile, first + "/" + fileName)) {
                        return configurations.get(configFile);
                    }
                }
            }
        }
        return "";
    }

    /**
     * Updates the configuration file.
     *
     * @param filename The name of the configuration file.
     * @param content The content of the configuration file.
     */
    public void updateConfigurationFile(String filename, String content) {
        Message message = new Message();
        message.setChannel(MessageChannel.CONFIGURATION);
        message.setKey(List.of(filename));
        message.setText(content);
        connection.notify("Message", sessionId, message);
    }

    /**
     * Initializes a new instance of the NewPlugin class.
     *
     * @param connection The connection to the AutoRest extension.
     * @param pluginName The name of the plugin.
     * @param sessionId The session id.
     */
    public NewPlugin(Connection connection, String pluginName, String sessionId) {
        this.connection = connection;
        this.pluginName = pluginName;
        this.sessionId = sessionId;
        Representer representer = new Representer(new DumperOptions());
        representer.setPropertyUtils(new AnnotatedPropertyUtils());
        representer.getPropertyUtils().setSkipMissingProperties(true);
        LoaderOptions loaderOptions = new LoaderOptions();
        loaderOptions.setCodePointLimit(50 * 1024 * 1024);
        loaderOptions.setMaxAliasesForCollections(Integer.MAX_VALUE);
        loaderOptions.setNestingDepthLimit(Integer.MAX_VALUE);
        loaderOptions.setTagInspector(new TrustedTagInspector());
        Constructor constructor = new CodeModelCustomConstructor(loaderOptions);
        yamlMapper = new Yaml(constructor, representer, new DumperOptions(), loaderOptions);
    }

    /**
     * The method that is called to run the plugin.
     *
     * @return Whether the plugin ran successfully.
     */
    public boolean process() {
        try {
            JavaSettings.setHost(this);
            return processInternal();
        } catch (Throwable t) {
            message(MessageChannel.FATAL, "Unhandled error: " + t.getMessage(), t, List.of(getClass().getSimpleName()));
            return false;
        }
    }

    /**
     * The method that is called to run the plugin.
     *
     * @return Whether the plugin ran successfully.
     */
    public abstract boolean processInternal();

    private String formatThrowableMessage(Throwable t) {
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);

        t.printStackTrace(printWriter);
        return stringWriter.toString();
    }
}
