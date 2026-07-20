// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.xml.implementation;

import com.azure.core.util.serializer.ObjectSerializer;

/**
 * This class is a proxy for creating an {@link ObjectSerializer} that serializes and deserializes XML payloads using
 * {@code azure-xml}. It mirrors the pattern of {@code JsonSerializerProviders} in {@code azure-core}, but for XML.
 */
public final class XmlSerializerProviders {

    /**
     * Creates an instance of an XML {@link ObjectSerializer}.
     *
     * @return A new instance of an XML {@link ObjectSerializer}.
     */
    public static ObjectSerializer createInstance() {
        return new XmlSerializer();
    }

    private XmlSerializerProviders() {
        // no-op
    }
}
