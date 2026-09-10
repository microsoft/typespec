// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.model;

import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

public class DevOptions implements JsonSerializable<DevOptions> {
    private boolean debug;

    public boolean isDebug() {
        return debug;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject().writeBooleanField("debug", debug).writeEndObject();
    }

    public static DevOptions fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            DevOptions options = new DevOptions();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("debug".equals(fieldName)) {
                    options.debug = reader.getBoolean();
                } else {
                    reader.skipChildren();
                }
            }
            return options;
        });
    }
}
