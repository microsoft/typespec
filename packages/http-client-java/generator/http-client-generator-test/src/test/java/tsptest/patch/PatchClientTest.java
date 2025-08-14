// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.patch;

import com.azure.core.util.BinaryData;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import tsptest.patch.implementation.JsonMergePatchHelper;
import tsptest.patch.models.Fish;
import tsptest.patch.models.InnerModel;
import tsptest.patch.models.Resource;
import tsptest.patch.models.Salmon;
import tsptest.patch.models.Shark;

public class PatchClientTest {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    public void testSerializationForNumbers() throws JsonProcessingException {
        Resource resource = new Resource();
        resource.setIntValue(null);
        resource.setLongValue(null);
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, true);
        String json = BinaryData.fromObject(resource).toString();
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, false);
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Assertions.assertEquals(JsonNodeType.NULL, node.get("longValue").getNodeType());
        Assertions.assertEquals(JsonNodeType.NULL, node.get("intValue").getNodeType());
    }

    @Test
    public void testSerializationForString() throws JsonProcessingException {
        Resource resource = new Resource();
        resource.setDescription(null);
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, true);
        String json = BinaryData.fromObject(resource).toString();
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, false);
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Assertions.assertEquals(JsonNodeType.NULL, node.get("description").getNodeType());
    }

    @Test
    public void testSerializationForNestedModelProperty() throws JsonProcessingException {
        Resource resource = new Resource();
        resource.setInnerModelProperty(new InnerModel());

        // serialize for inner model property
        resource.getInnerModelProperty().setDescription(null);
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, true);
        String json = BinaryData.fromObject(resource).toString();
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, false);
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Assertions.assertEquals(JsonNodeType.NULL,
            node.get("wireNameForInnerModelProperty").get("description").getNodeType());

        // serialize for outer model property
        resource.setInnerModelProperty(null);
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, true);
        json = BinaryData.fromObject(resource).toString();
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, false);
        node = OBJECT_MAPPER.readTree(json);
        Assertions.assertEquals(JsonNodeType.NULL, node.get("wireNameForInnerModelProperty").getNodeType());
    }

    @Test
    public void testSerializationForMapProperty() throws JsonProcessingException {
        Resource resource = new Resource();
        Map<String, InnerModel> map = new HashMap<>();
        map.put("key", null);
        resource.setMap(map);
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, true);
        String json = BinaryData.fromObject(resource).toString();
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, false);
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Assertions.assertEquals(JsonNodeType.NULL, node.get("map").get("key").getNodeType());
    }

    @Test
    public void testSerializationForMapNullKeyProperty() {
        Exception exception = Assertions.assertThrows(NullPointerException.class, () -> {
            Resource resource = new Resource();
            Map<String, InnerModel> map = new HashMap<>();
            resource.setMap(map);
            map.put(null, new InnerModel());
            JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, true);
            BinaryData.fromObject(resource).toString();
            JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, false);
        });

        String expectedMessage = "'fieldName' cannot be null.";
        String actualMessage = exception.getMessage();

        Assertions.assertTrue(actualMessage.contains(expectedMessage));
    }

    @Test
    public void testSerializationForArrayProperty() throws JsonProcessingException {
        Resource resource = new Resource();
        resource.setArray(Arrays.asList(new InnerModel().setName("value1"), new InnerModel().setName("value2")));
        Map<String, InnerModel> map = new HashMap<>();
        map.put("key", null);
        resource.setMap(map);
        resource.getArray().set(0, null);
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, true);
        String json = BinaryData.fromObject(resource).toString(); // {"map":{"key":null},"array":[null,{"name":"value2"}]}
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, false);
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Assertions.assertEquals(JsonNodeType.NULL, node.get("map").get("key").getNodeType());
        Assertions.assertEquals(2, node.get("array").size());
        Assertions.assertTrue(node.get("array").get(0).isNull());
        Assertions.assertEquals("value2", node.get("array").get(1).get("name").asText());
    }

    @Test
    public void testSerializationForEnumProperty() throws JsonProcessingException {
        Resource resource = new Resource();
        resource.setEnumValue(null);
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, true);
        String json = BinaryData.fromObject(resource).toString();
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, false);
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Assertions.assertEquals(JsonNodeType.NULL, node.get("enumValue").getNodeType());
    }

    @Test
    public void testSerializationForHierarchicalProperty() throws JsonProcessingException {
        Resource resource = new Resource();
        Fish shark = new Shark().setAge(2);
        shark.setColor(null);
        resource.setFish(shark);
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, true);
        String json = BinaryData.fromObject(resource).toString();
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resource, false);
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Assertions.assertEquals(JsonNodeType.NULL, node.get("fish").get("color").getNodeType());
        Assertions.assertEquals("shark", node.get("fish").get("kind").asText());
        Assertions.assertEquals(2, node.get("fish").get("age").asInt());
    }

    @Test
    public void testSerializationForHierarchicalModel() throws JsonProcessingException {
        Fish fish = new Salmon().setAge(1);
        fish.setColor(null);
        JsonMergePatchHelper.getFishAccessor().prepareModelForJsonMergePatch(fish, true);
        String json = BinaryData.fromObject(fish).toString();
        JsonMergePatchHelper.getFishAccessor().prepareModelForJsonMergePatch(fish, false);
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Assertions.assertEquals("salmon", fish.getKind());
        Assertions.assertEquals(JsonNodeType.NULL, node.get("color").getNodeType());

        Salmon salmon = new Salmon().setAge(2);
        salmon.setColor(null);
        JsonMergePatchHelper.getFishAccessor().prepareModelForJsonMergePatch(salmon, true);
        String jsonSalmon = BinaryData.fromObject(salmon).toString();
        JsonMergePatchHelper.getFishAccessor().prepareModelForJsonMergePatch(salmon, false);
        JsonNode nodeSalmon = OBJECT_MAPPER.readTree(jsonSalmon);
        Assertions.assertEquals("salmon", salmon.getKind());
        Assertions.assertEquals(JsonNodeType.NULL, nodeSalmon.get("color").getNodeType());
    }

    @Test
    public void testSerializePropertiesInUpdatedPropertiesMapOnly() throws JsonProcessingException {
        Resource resource = new Resource();
        resource.setDescription("my desc");
        resource.setIntValue(1);
        // update resource, only int value property is updated, so description property should not be in payload
        Resource resourceToUpdate = BinaryData.fromObject(resource).toObject(Resource.class);
        resourceToUpdate.setIntValue(null);
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resourceToUpdate, true);
        String json = BinaryData.fromObject(resourceToUpdate).toString();
        JsonMergePatchHelper.getResourceAccessor().prepareModelForJsonMergePatch(resourceToUpdate, false);
        JsonNode node = OBJECT_MAPPER.readTree(json);
        Assertions.assertNull(node.get("description"));
        Assertions.assertEquals(JsonNodeType.NULL, node.get("intValue").getNodeType());
    }
}

