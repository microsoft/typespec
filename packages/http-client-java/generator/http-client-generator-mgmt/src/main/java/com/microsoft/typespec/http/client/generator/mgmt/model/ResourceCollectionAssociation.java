// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;

public class ResourceCollectionAssociation implements JsonSerializable<ResourceCollectionAssociation> {

    private String resource;
    private String collection;

    public String getResource() {
        return resource;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

    public String getCollection() {
        return collection;
    }

    public void setCollection(String collection) {
        this.collection = collection;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("resource", resource)
            .writeStringField("collection", collection)
            .writeEndObject();
    }

    public static ResourceCollectionAssociation fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ResourceCollectionAssociation::new,
            (association, fieldName, reader) -> {
                if (fieldName.equals("resource")) {
                    association.resource = reader.getString();
                } else if (fieldName.equals("collection")) {
                    association.collection = reader.getString();
                } else {
                    reader.skipChildren();
                }
            });
    }
}
