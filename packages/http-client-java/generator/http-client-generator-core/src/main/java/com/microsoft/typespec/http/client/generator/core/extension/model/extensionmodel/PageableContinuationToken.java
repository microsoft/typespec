// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Header;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import java.io.IOException;
import java.util.List;

public class PageableContinuationToken implements JsonSerializable<PageableContinuationToken> {

    private Parameter parameter;
    private List<Property> responseProperty;
    private Header responseHeader;

    public Parameter getParameter() {
        return parameter;
    }

    public void setParameter(Parameter parameter) {
        this.parameter = parameter;
    }

    public List<Property> getResponseProperty() {
        return responseProperty;
    }

    public void setResponseProperty(List<Property> responseProperty) {
        this.responseProperty = responseProperty;
    }

    public Header getResponseHeader() {
        return responseHeader;
    }

    public void setResponseHeader(Header responseHeader) {
        this.responseHeader = responseHeader;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("parameter", parameter)
            .writeArrayField("responseProperty", responseProperty, JsonWriter::writeJson)
            .writeJsonField("responseHeader", responseHeader)
            .writeEndObject();
    }

    public static PageableContinuationToken fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, PageableContinuationToken::new,
            (continuationToken, fieldName, reader) -> {
                if ("parameter".equals(fieldName)) {
                    continuationToken.parameter = Parameter.fromJson(jsonReader);
                } else if ("responseProperty".equals(fieldName)) {
                    continuationToken.responseProperty = reader.readArray(Property::fromJson);
                } else if ("responseHeader".equals(fieldName)) {
                    continuationToken.responseHeader = Header.fromJson(jsonReader);
                } else {
                    reader.skipChildren();
                }
            });
    }
}
