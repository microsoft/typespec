// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

/**
 * Represents the per-protocol metadata on a given aspect.
 */
public class Protocol implements JsonSerializable<Protocol> {
    private RequestParameterLocation in;
    private String path;
    private String uri;
    private String method;
    private KnownMediaType knownMediaType;
    private SerializationStyle style;
    private boolean explode;
    private List<String> mediaTypes;
    private List<Server> servers;
    private List<String> statusCodes;
    private List<Header> headers;

    /**
     * Creates a new instance of the Protocol class.
     */
    public Protocol() {
    }

    /**
     * Gets the location of the parameter.
     *
     * @return The location of the parameter.
     */
    public RequestParameterLocation getIn() {
        return in;
    }

    /**
     * Sets the location of the parameter.
     *
     * @param in The location of the parameter.
     */
    public void setIn(RequestParameterLocation in) {
        this.in = in;
    }

    /**
     * Gets the path of the protocol.
     *
     * @return The path of the protocol.
     */
    public String getPath() {
        return path;
    }

    /**
     * Sets the path of the protocol.
     *
     * @param path The path of the protocol.
     */
    public void setPath(String path) {
        this.path = path;
    }

    /**
     * Gets the method of the protocol.
     *
     * @return The method of the protocol.
     */
    public String getMethod() {
        return method;
    }

    /**
     * Sets the method of the protocol.
     *
     * @param method The method of the protocol.
     */
    public void setMethod(String method) {
        this.method = method;
    }

    /**
     * Gets the known media type of the protocol.
     *
     * @return The known media type of the protocol.
     */
    public KnownMediaType getKnownMediaType() {
        return knownMediaType;
    }

    /**
     * Sets the known media type of the protocol.
     *
     * @param knownMediaType The known media type of the protocol.
     */
    public void setKnownMediaType(KnownMediaType knownMediaType) {
        this.knownMediaType = knownMediaType;
    }

    /**
     * Gets the servers of the protocol.
     *
     * @return The servers of the protocol.
     */
    public List<Server> getServers() {
        return servers;
    }

    /**
     * Sets the servers of the protocol.
     *
     * @param servers The servers of the protocol.
     */
    public void setServers(List<Server> servers) {
        this.servers = servers;
    }

    /**
     * Gets the media types of the protocol.
     *
     * @return The media types of the protocol.
     */
    public List<String> getMediaTypes() {
        return mediaTypes;
    }

    /**
     * Sets the media types of the protocol.
     *
     * @param mediaTypes The media types of the protocol.
     */
    public void setMediaTypes(List<String> mediaTypes) {
        this.mediaTypes = mediaTypes;
    }

    /**
     * Gets the status codes of the protocol.
     *
     * @return The status codes of the protocol.
     */
    public List<String> getStatusCodes() {
        return statusCodes;
    }

    /**
     * Sets the status codes of the protocol.
     *
     * @param statusCodes The status codes of the protocol.
     */
    public void setStatusCodes(List<String> statusCodes) {
        this.statusCodes = statusCodes;
    }

    /**
     * Gets the headers of the protocol.
     *
     * @return The headers of the protocol.
     */
    public List<Header> getHeaders() {
        return headers;
    }

    /**
     * Sets the headers of the protocol.
     *
     * @param headers The headers of the protocol.
     */
    public void setHeaders(List<Header> headers) {
        this.headers = headers;
    }

    /**
     * Gets the URI of the protocol.
     *
     * @return The URI of the protocol.
     */
    public String getUri() {
        return uri;
    }

    /**
     * Sets the URI of the protocol.
     *
     * @param uri The URI of the protocol.
     */
    public void setUri(String uri) {
        this.uri = uri;
    }

    /**
     * Gets the serialization style of the protocol.
     *
     * @return The serialization style of the protocol.
     */
    public SerializationStyle getStyle() {
        return style;
    }

    /**
     * Sets the serialization style of the protocol.
     *
     * @param style The serialization style of the protocol.
     */
    public void setStyle(SerializationStyle style) {
        this.style = style;
    }

    /**
     * Gets whether the protocol should be exploded.
     *
     * @return Whether the protocol should be exploded.
     */
    public boolean getExplode() {
        return explode;
    }

    /**
     * Sets whether the protocol should be exploded.
     *
     * @param explode Whether the protocol should be exploded.
     */
    public void setExplode(boolean explode) {
        this.explode = explode;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("in", in == null ? null : in.toString())
            .writeStringField("path", path)
            .writeStringField("uri", uri)
            .writeStringField("method", method)
            .writeStringField("knownMediaType", knownMediaType == null ? null : knownMediaType.toString())
            .writeStringField("style", style == null ? null : style.toString())
            .writeBooleanField("explode", explode)
            .writeArrayField("mediaTypes", mediaTypes, JsonWriter::writeString)
            .writeArrayField("servers", servers, JsonWriter::writeJson)
            .writeArrayField("statusCodes", statusCodes, JsonWriter::writeString)
            .writeArrayField("headers", headers, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a Protocol instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Protocol instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Protocol fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Protocol::new, (protocol, fieldName, reader) -> {
            if ("in".equals(fieldName)) {
                protocol.in = RequestParameterLocation.fromValue(reader.getString());
            } else if ("path".equals(fieldName)) {
                protocol.path = reader.getString();
            } else if ("uri".equals(fieldName)) {
                protocol.uri = reader.getString();
            } else if ("method".equals(fieldName)) {
                protocol.method = reader.getString();
            } else if ("knownMediaType".equals(fieldName)) {
                protocol.knownMediaType = KnownMediaType.fromValue(reader.getString());
            } else if ("style".equals(fieldName)) {
                protocol.style = SerializationStyle.fromValue(reader.getString());
            } else if ("explode".equals(fieldName)) {
                protocol.explode = reader.getBoolean();
            } else if ("mediaTypes".equals(fieldName)) {
                protocol.mediaTypes = reader.readArray(JsonReader::getString);
            } else if ("servers".equals(fieldName)) {
                protocol.servers = reader.readArray(Server::fromJson);
            } else if ("statusCodes".equals(fieldName)) {
                protocol.statusCodes = reader.readArray(JsonReader::getString);
            } else if ("headers".equals(fieldName)) {
                protocol.headers = reader.readArray(Header::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
