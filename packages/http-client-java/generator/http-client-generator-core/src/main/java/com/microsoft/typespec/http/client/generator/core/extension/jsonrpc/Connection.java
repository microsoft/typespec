// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.jsonrpc;

import com.azure.json.JsonProviders;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Represents a connection.
 */
public class Connection {
    private OutputStream writer;
    private PeekingBinaryReader reader;
    private boolean isDisposed = false;
    private final AtomicInteger requestId;
    private final Map<Integer, CompletableFuture<String>> tasks = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private final CompletableFuture<Void> loop;
    private final Map<String, Function<String, String>> dispatch = new ConcurrentHashMap<>();

    /**
     * Create a new Connection.
     *
     * @param writer The output stream to write to.
     * @param input The input stream to read from.
     */
    public Connection(OutputStream writer, InputStream input) {
        this.writer = writer;
        this.reader = new PeekingBinaryReader(input);
        this.loop = CompletableFuture.runAsync(this::listen);
        this.requestId = new AtomicInteger(0);
    }

    private volatile boolean isAlive = true;

    /**
     * Stops the connection.
     */
    public void stop() {
        isAlive = false;
        loop.cancel(true);
    }

    private String readJson() {
        String jsonText = "";
        while (true) {
            try {
                jsonText += reader.readAsciiLine(); // + "\n";
            } catch (IOException e) {
                throw new RuntimeException("Cannot read JSON input");
            }
            try {
                validateJsonText(jsonText);
                return jsonText;
            } catch (IOException e) {
                // not enough text?
            }
        }
    }

    /**
     * Tests that the passed {@code jsonText} is valid JSON.
     *
     * @param jsonText The JSON text to validate.
     * @throws IOException If the JSON text is invalid.
     */
    private static void validateJsonText(String jsonText) throws IOException {
        try (JsonReader jsonReader = JsonProviders.createReader(jsonText)) {
            jsonReader.readUntyped();
        }
    }

    /**
     * Dispatches a message.
     *
     * @param path The path.
     * @param method The method that gets the result as a JSON string.
     */
    public void dispatch(String path, Supplier<String> method) {
        dispatch.put(path, input -> {
            String result = method.get();

            return (result == null) ? "null" : result;
        });
    }

    private static List<String> readArguments(String input) {
        try (JsonReader jsonReader = JsonProviders.createReader(input)) {
            List<String> ret = jsonReader.readArray(JsonReader::getString);
            if (ret.size() == 2) {
                // Return passed array if size is larger than 0, otherwise return a new ArrayList
                return ret;
            }

            throw new RuntimeException("Invalid number of arguments");
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    /**
     * Dispatches a notification.
     *
     * @param path The path.
     * @param method The method.
     */
    public void dispatchNotification(String path, Runnable method) {
        dispatch.put(path, input -> {
            method.run();
            return null;
        });
    }

    /**
     * Dispatches a message.
     *
     * @param path The path.
     * @param method The method that gets the result as a JSON string.
     */
    public void dispatch(String path, BiFunction<String, String, Boolean> method) {
        dispatch.put(path, input -> {
            List<String> args = readArguments(input);
            return String.valueOf(method.apply(args.get(0), args.get(1)));
        });
    }

    private String readJson(int contentLength) {
        try {
            return new String(reader.readBytes(contentLength), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private boolean listen() {
        while (isAlive) {
            try {
                int ch = reader.peekByte();
                if (-1 == ch) {
                    // didn't get anything. start again, it'll know if we're shutting down
                    break;
                }

                if ('{' == ch || '[' == ch) {
                    // looks like a json block or array. let's do this.
                    // don't wait for this to finish!
                    process(readJson(), '{' == ch);

                    // we're done here, start again.
                    continue;
                }

                // We're looking at headers
                Map<String, String> headers = new HashMap<>();
                String line = reader.readAsciiLine();
                while (line != null && !line.isEmpty()) {
                    String[] bits = line.split(":", 2);
                    headers.put(bits[0].trim(), bits[1].trim());
                    line = reader.readAsciiLine();
                }

                ch = reader.peekByte();
                // the next character had better be a { or [
                if ('{' == ch || '[' == ch) {
                    String contentLengthStr = headers.get("Content-Length");
                    if (contentLengthStr != null && !contentLengthStr.isEmpty()) {
                        int contentLength = Integer.parseInt(contentLengthStr);
                        // don't wait for this to finish!
                        process(readJson(contentLength), '{' == ch);
                        continue;
                    }
                    // looks like a json block or array. let's do this.
                    // don't wait for this to finish!
                    process(readJson(), '{' == ch);
                    // we're done here, start again.
                    continue;
                }

                return false;

            } catch (Exception e) {
                if (!isAlive) {
                    throw new RuntimeException(e);
                }
            }
        }
        return false;
    }

    /**
     * Processes a message.
     *
     * @param content The content.
     * @param isObject Whether the JSON {@code content} is a JSON object.
     */
    public void process(String content, boolean isObject) {
        // The only times this method is called is when the beginning portion of the JSON text is '{' or '['.
        // So, instead of the previous design when using Jackson where a fully processed JsonNode was passed, use a
        // simpler parameter 'isObject' to check if we are in a valid processing state.
        if (!isObject) {
            System.err.println("Unhandled: Batch Request");
            return;
        }

        executorService.submit(() -> {

            try (JsonReader jsonReader = JsonProviders.createReader(content)) {
                Map<String, String> jobject = jsonReader.readMap(reader -> {
                    if (reader.isStartArrayOrObject()) {
                        return reader.readChildren();
                    } else {
                        return reader.getString();
                    }
                });

                String method = jobject.get("method");
                if (method != null) {
                    int id = processIdField(jobject.get("id"));

                    // this is a method call.
                    // pass it to the service that is listening...
                    if (dispatch.containsKey(method)) {
                        Function<String, String> fn = dispatch.get(method);
                        String parameters = jobject.get("params");
                        String result = fn.apply(parameters);
                        if (id != -1) {
                            // if this is a request, send the response.
                            respond(id, result);
                        }
                    }
                    return;
                }

                if (jobject.containsKey("result")) {
                    String result = jobject.get("result");
                    int id = processIdField(jobject.get("id"));
                    if (id != -1) {
                        CompletableFuture<String> f = tasks.remove(id);

                        try {
                            f.complete(result);
                        } catch (Exception e) {
                            f.completeExceptionally(e);
                        }
                    }
                    return;
                }

                String error = jobject.get("error");
                if (error != null) {
                    int id = processIdField(jobject.get("id"));
                    if (id != -1) {
                        CompletableFuture<String> f = tasks.remove(id);

                        try (JsonReader errorReader = JsonProviders.createReader(error)) {
                            Map<String, Object> errorObject = errorReader.readMap(JsonReader::readUntyped);

                            String message = String.valueOf(errorObject.get("message"));
                            Object dataField = errorObject.get("data");
                            if (dataField != null) {
                                message += " (" + dataField + ")";
                            }
                            f.completeExceptionally(new RuntimeException(message));
                        } catch (Exception e) {
                            f.completeExceptionally(e);
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private static int processIdField(String idField) {
        return (idField == null) ? -1 : Integer.parseInt(idField);
    }

    /**
     * Closes the connection.
     *
     * @throws IOException If an I/O error occurs.
     */
    protected void close() throws IOException {
        // ensure that we are in a cancelled state.
        isAlive = false;
        if (!isDisposed) {
            // make sure we can't dispose twice
            isDisposed = true;
            tasks.forEach((ignored, future) -> future.cancel(true));

            writer.close();
            writer = null;
            reader.close();
            reader = null;
        }
    }

    private void send(String text) {
        byte[] data = text.getBytes(StandardCharsets.UTF_8);
        byte[] header = ("Content-Length: " + data.length + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII);
        byte[] buffer = new byte[header.length + data.length];
        System.arraycopy(header, 0, buffer, 0, header.length);
        System.arraycopy(data, 0, buffer, header.length, data.length);
        try {
            writer.write(buffer);
            writer.flush();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Sends an error.
     *
     * @param id The id.
     * @param code The code.
     * @param message The message.
     */
    public void sendError(int id, int code, String message) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JsonWriter jsonWriter = JsonProviders.createWriter(outputStream)) {
            jsonWriter.writeStartObject()
                .writeStringField("jsonrpc", "2.0")
                .writeIntField("id", id)
                .writeStringField("message", message)
                .writeStartObject("error")
                .writeIntField("code", code)
                .writeEndObject()
                .writeEndObject()
                .flush();

            send(outputStream.toString(StandardCharsets.UTF_8));
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    /**
     * Sends a response.
     *
     * @param id The id.
     * @param value The value.
     */
    public void respond(int id, String value) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JsonWriter jsonWriter = JsonProviders.createWriter(outputStream)) {
            jsonWriter.writeStartObject()
                .writeStringField("jsonrpc", "2.0")
                .writeIntField("id", id)
                .writeRawField("result", value)
                .writeEndObject()
                .flush();

            send(outputStream.toString(StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Sends a notification.
     *
     * @param methodName The method name.
     * @param values The values.
     */
    public void notify(String methodName, Object... values) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JsonWriter jsonWriter = JsonProviders.createWriter(outputStream)) {
            jsonWriter.writeArray(values, JsonWriter::writeUntyped).flush();
            notifyWithSerializedObject(methodName, outputStream.toString(StandardCharsets.UTF_8));
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    /**
     * Sends a notification.
     *
     * @param methodName The method name.
     * @param serializedObject The serialized object.
     */
    public void notifyWithSerializedObject(String methodName, String serializedObject) {
        String json = (serializedObject == null)
            ? "{\"jsonrpc\":\"2.0\",\"method\":\"" + methodName + "\"}"
            : "{\"jsonrpc\":\"2.0\",\"method\":\"" + methodName + "\",\"params\":" + serializedObject + "}";

        send(json);
    }

    /**
     * Sends a request.
     *
     * @param methodName The method name.
     * @param values The values.
     * @return The result.
     */
    public String request(String methodName, Object... values) {
        int id = requestId.getAndIncrement();
        CompletableFuture<String> response = new CompletableFuture<>();
        tasks.put(id, response);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JsonWriter jsonWriter = JsonProviders.createWriter(outputStream)) {
            jsonWriter.writeStartObject()
                .writeStringField("jsonrpc", "2.0")
                .writeStringField("method", methodName)
                .writeIntField("id", id)
                .writeArrayField("params", values, JsonWriter::writeUntyped)
                .writeEndObject()
                .flush();

            send(outputStream.toString(StandardCharsets.UTF_8));

            return response.get();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Sends a request.
     *
     * @param method The method name.
     * @param serializedObject The serialized object.
     * @return The result.
     */
    public String requestWithSerializedObject(String method, String serializedObject) {
        int id = requestId.getAndIncrement();
        CompletableFuture<String> response = new CompletableFuture<>();
        tasks.put(id, response);

        String json = (serializedObject == null)
            ? "{\"jsonrpc\":\"2.0\",\"method\":\"" + method + "\",\"id\":" + id + "}"
            : "{\"jsonrpc\":\"2.0\",\"method\":\"" + method + "\",\"id\":" + id + ",\"params\":" + serializedObject + "}";

        send(json);
        try {
            return response.get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Waits for all requests to complete.
     */
    public void waitForAll() {
        try {
            loop.get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }
}
