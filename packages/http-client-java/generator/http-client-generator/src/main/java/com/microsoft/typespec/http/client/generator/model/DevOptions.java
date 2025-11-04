// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.model;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonWriter;

import java.io.IOException;

public class DevOptions implements JsonSerializable<DevOptions> {
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject().writeEndObject();
    }

    public static DevOptions fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readEmptyObject(jsonReader, DevOptions::new);
    }
}
