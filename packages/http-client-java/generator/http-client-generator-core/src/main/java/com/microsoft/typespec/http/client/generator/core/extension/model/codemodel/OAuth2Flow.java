// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

public final class OAuth2Flow implements JsonSerializable<OAuth2Flow> {

    public static final class OAuth2Scope implements JsonSerializable<OAuth2Scope> {
        private String value;
        private String description;

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        @Override
        public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
            return jsonWriter.writeStartObject()
                .writeStringField("value", value)
                .writeStringField("description", description)
                .writeEndObject();
        }

        public static OAuth2Scope fromJson(JsonReader jsonReader) throws IOException {
            return JsonUtils.readObject(jsonReader, OAuth2Scope::new, (scope, fieldName, reader) -> {
                if ("value".equals(fieldName)) {
                    scope.value = reader.getString();
                } else if ("description".equals(fieldName)) {
                    scope.description = reader.getString();
                } else {
                    reader.skipChildren();
                }
            });
        }
    }

    private String type;
    private String authorizationUrl;
    private String tokenUrl;
    private String refreshUrl;
    private List<OAuth2Scope> scopes;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAuthorizationUrl() {
        return authorizationUrl;
    }

    public void setAuthorizationUrl(String authorizationUrl) {
        this.authorizationUrl = authorizationUrl;
    }

    public String getTokenUrl() {
        return tokenUrl;
    }

    public void setTokenUrl(String tokenUrl) {
        this.tokenUrl = tokenUrl;
    }

    public String getRefreshUrl() {
        return refreshUrl;
    }

    public void setRefreshUrl(String refreshUrl) {
        this.refreshUrl = refreshUrl;
    }

    public List<OAuth2Scope> getScopes() {
        return scopes;
    }

    public void setScopes(List<OAuth2Scope> scopes) {
        this.scopes = scopes;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("type", type)
            .writeStringField("authorizationUrl", authorizationUrl)
            .writeStringField("tokenUrl", tokenUrl)
            .writeStringField("refreshUrl", refreshUrl)
            .writeArrayField("scopes", scopes, JsonWriter::writeJson)
            .writeEndObject();
    }

    public static OAuth2Flow fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, OAuth2Flow::new, (flow, fieldName, reader) -> {
            if ("type".equals(fieldName)) {
                flow.type = reader.getString();
            } else if ("authorizationUrl".equals(fieldName)) {
                flow.authorizationUrl = reader.getString();
            } else if ("tokenUrl".equals(fieldName)) {
                flow.tokenUrl = reader.getString();
            } else if ("refreshUrl".equals(fieldName)) {
                flow.refreshUrl = reader.getString();
            } else if ("scopes".equals(fieldName)) {
                flow.scopes = reader.readArray(OAuth2Scope::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
