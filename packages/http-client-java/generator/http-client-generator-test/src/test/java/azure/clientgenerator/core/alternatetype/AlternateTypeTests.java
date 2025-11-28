// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.alternatetype;

import azure.clientgenerator.core.alternatetype.externaltype.models.ModelWithFeatureProperty;
import com.azure.core.models.GeoBoundingBox;
import com.azure.core.models.GeoObject;
import com.azure.core.models.GeoObjectType;
import com.azure.core.models.GeoPoint;
import com.azure.core.util.BinaryData;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;
import java.io.IOException;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class AlternateTypeTests {

    private final AlternateTypeClient client = new AlternateTypeClientBuilder().buildClient();

    public static final class GeoFeature extends GeoObject {

        private final GeoObjectType TYPE = GeoObjectType.fromString("Feature");
        private GeoPoint geometry;
        private Map<String, Object> properties;
        private String id;

        public GeoFeature(GeoBoundingBox boundingBox, Map<String, Object> customProperties) {
            super(boundingBox, customProperties);
        }

        @Override
        public GeoObjectType getType() {
            return TYPE;
        }

        @Override
        public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
            jsonWriter.writeStartObject();
            jsonWriter.writeStringField("type", TYPE.toString());
            jsonWriter.writeJsonField("geometry", this.geometry);
            jsonWriter.writeMapField("properties", this.properties, JsonWriter::writeUntyped);
            jsonWriter.writeStringField("id", this.id);
            return jsonWriter.writeEndObject();
        }

        // fromJson is not able to work if de-serialization is invoked via GeoObject
        public static GeoObject fromJson(JsonReader jsonReader) throws IOException {
            return jsonReader.readObject(reader -> {
                GeoPoint geometry = null;
                Map<String, Object> properties = null;
                String id = null;
                while (reader.nextToken() != null && reader.currentToken() != com.azure.json.JsonToken.END_OBJECT) {
                    String fieldName = reader.getFieldName();
                    reader.nextToken();
                    if ("geometry".equals(fieldName)) {
                        geometry = reader.readObject(GeoPoint::fromJson);
                    } else if ("properties".equals(fieldName)) {
                        properties = reader.readMap(JsonReader::readUntyped);
                    } else if ("id".equals(fieldName)) {
                        id = reader.getString();
                    } else {
                        reader.skipChildren();
                    }
                }
                GeoFeature feature = new GeoFeature(null, null);
                feature.geometry = geometry;
                feature.properties = properties;
                feature.id = id;
                return feature;
            });
        }
    }

    private static final GeoFeature FEATURE = new GeoFeature(null, null);
    static {
        FEATURE.id = "feature-1";
        FEATURE.properties = Map.of("name", "A single point of interest", "category", "landmark", "elevation", 100);
        FEATURE.geometry = new GeoPoint(-122.25, 37.87);
    }

    /**
     * The spector test maps GeoFeature to GeoObject, because azure-core does not have GeoFeature class.
     * 
     * Since this 2 classes are not same, in test we cannot directly use GeoObject to pass the test.
     * Therefore,
     * 1. We had to write a GeoFeature here.
     * 2. Invocation in test is not able to de-serialize GeoObject into GeoFeature, as the "fromJson" in GeoObject need
     * to know all its child classes.
     */

    @SuppressWarnings("unchecked")
    @Test
    public void testProperty() {
        ModelWithFeatureProperty model = new ModelWithFeatureProperty(FEATURE, "extra");
        client.putProperty(model);

        BinaryData data = client.getPropertyWithResponse(null).getValue();
        Map<String, Object> modelAsMap = (Map<String, Object>) data.toObject(Map.class);
        GeoFeature feature = BinaryData.fromObject(modelAsMap.get("feature")).toObject(GeoFeature.class);
        Assertions.assertEquals("feature-1", feature.id);
    }

    @Test
    public void testModel() throws IOException {
        client.putModelWithResponse(BinaryData.fromBytes(FEATURE.toJsonBytes()), null);

        BinaryData data = client.getModelWithResponse(null).getValue();
        GeoFeature feature = data.toObject(GeoFeature.class);
        Assertions.assertEquals("feature-1", feature.id);
        Assertions.assertEquals(3, feature.properties.size());
        Assertions.assertEquals(-122.25, feature.geometry.getCoordinates().getLongitude());
    }
}
