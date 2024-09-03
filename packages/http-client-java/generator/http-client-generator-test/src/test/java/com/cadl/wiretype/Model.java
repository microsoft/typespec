// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.cadl.wiretype;

import com.azure.core.util.DateTimeRfc1123;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;

public final class Model {

    @JsonProperty(value = "dateTimeRfc7231")
    private DateTimeRfc1123 dateTimeRfc7231;

    public Model(OffsetDateTime dateTimeRfc7231) {
        this.dateTimeRfc7231 = new DateTimeRfc1123(dateTimeRfc7231);
    }

    // Jackson fails with below error, if this private constructor not provided
    // java.io.UncheckedIOException: com.fasterxml.jackson.databind.exc.InvalidDefinitionException: Cannot construct instance of `com.cadl.wiretype.Model` (no Creators, like default constructor, exist): cannot deserialize from Object value (no delegate- or property-based Creator)
    private Model() {
    }

    // Alternatively, Jackson also fine with this private constructor. However, we seems do not really want this added complexity.
//    @JsonCreator
//    private Model(@JsonProperty(value = "dateTimeRfc7231") DateTimeRfc1123 dateTimeRfc7231) {
//        this.dateTimeRfc7231 = dateTimeRfc7231;
//    }

    public OffsetDateTime getDateTimeRfc7231() {
        return this.dateTimeRfc7231.getDateTime();
    }
}
