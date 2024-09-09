// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.additionalproperties;

import com.azure.core.util.BinaryData;
import com.type.property.additionalproperties.models.DifferentSpreadFloatRecord;
import com.type.property.additionalproperties.models.DifferentSpreadModelArrayRecord;
import com.type.property.additionalproperties.models.DifferentSpreadModelRecord;
import com.type.property.additionalproperties.models.DifferentSpreadStringRecord;
import com.type.property.additionalproperties.models.ModelForRecord;
import com.type.property.additionalproperties.models.SpreadFloatRecord;
import com.type.property.additionalproperties.models.SpreadModelArrayRecord;
import com.type.property.additionalproperties.models.SpreadModelRecord;
import com.type.property.additionalproperties.models.SpreadRecordForDiscriminatedUnion;
import com.type.property.additionalproperties.models.SpreadRecordForNonDiscriminatedUnion;
import com.type.property.additionalproperties.models.SpreadRecordForNonDiscriminatedUnion2;
import com.type.property.additionalproperties.models.SpreadRecordForNonDiscriminatedUnion3;
import com.type.property.additionalproperties.models.SpreadRecordForUnion;
import com.type.property.additionalproperties.models.SpreadStringRecord;
import com.type.property.additionalproperties.models.WidgetData0;
import com.type.property.additionalproperties.models.WidgetData1;
import com.type.property.additionalproperties.models.WidgetData2;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class SpreadTests {
    private final SpreadStringClient spreadStringClient = new AdditionalPropertiesClientBuilder().buildSpreadStringClient();
    private final SpreadFloatClient spreadFloatClient = new AdditionalPropertiesClientBuilder().buildSpreadFloatClient();
    private final SpreadModelClient spreadModelClient = new AdditionalPropertiesClientBuilder().buildSpreadModelClient();
    private final SpreadModelArrayClient spreadModelArrayClient = new AdditionalPropertiesClientBuilder().buildSpreadModelArrayClient();
    private final SpreadDifferentStringClient spreadDifferentStringClient = new AdditionalPropertiesClientBuilder().buildSpreadDifferentStringClient();
    private final SpreadDifferentFloatClient spreadDifferentFloatClient = new AdditionalPropertiesClientBuilder().buildSpreadDifferentFloatClient();
    private final SpreadDifferentModelClient spreadDifferentModelClient = new AdditionalPropertiesClientBuilder().buildSpreadDifferentModelClient();
    private final SpreadDifferentModelArrayClient spreadDifferentModelArrayClient = new AdditionalPropertiesClientBuilder().buildSpreadDifferentModelArrayClient();
    private final SpreadRecordUnionClient spreadRecordUnionClient = new AdditionalPropertiesClientBuilder().buildSpreadRecordUnionClient();
    private final SpreadRecordDiscriminatedUnionClient spreadRecordDiscriminatedUnionClient = new AdditionalPropertiesClientBuilder().buildSpreadRecordDiscriminatedUnionClient();
    private final SpreadRecordNonDiscriminatedUnionClient spreadRecordNonDiscriminatedUnionClient = new AdditionalPropertiesClientBuilder().buildSpreadRecordNonDiscriminatedUnionClient();
    private final SpreadRecordNonDiscriminatedUnion2Client spreadRecordNonDiscriminatedUnion2Client = new AdditionalPropertiesClientBuilder().buildSpreadRecordNonDiscriminatedUnion2Client();
    private final SpreadRecordNonDiscriminatedUnion3Client spreadRecordNonDiscriminatedUnion3Client = new AdditionalPropertiesClientBuilder().buildSpreadRecordNonDiscriminatedUnion3Client();

    @Test
    public void testSpreadString() {
        Map<String, String> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", "abc");
        SpreadStringRecord body = new SpreadStringRecord("SpreadSpringRecord");
        body.setAdditionalProperties(propertyMap);
        spreadStringClient.put(body);

        SpreadStringRecord record = spreadStringClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals("SpreadSpringRecord", record.getName());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop"));
        Assertions.assertEquals("abc", record.getAdditionalProperties().get("prop"));
    }

    @Test
    public void testSpreadFloat() {
        Map<String, Double> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", 43.125);
        SpreadFloatRecord body = new SpreadFloatRecord(43.125);
        body.setAdditionalProperties(propertyMap);
        spreadFloatClient.put(body);

        SpreadFloatRecord record = spreadFloatClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals(43.125, record.getId());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop"));
        Assertions.assertEquals(43.125, record.getAdditionalProperties().get("prop"));
    }

    @Test
    public void testSpreadModel() {
        Map<String, ModelForRecord> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", new ModelForRecord("ok"));
        SpreadModelRecord body = new SpreadModelRecord(new ModelForRecord("ok"));
        body.setAdditionalProperties(propertyMap);
        spreadModelClient.put(body);

        SpreadModelRecord record = spreadModelClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertNotNull(record.getKnownProp());
        Assertions.assertEquals("ok", record.getKnownProp().getState());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop"));
        Assertions.assertEquals("ok", record.getAdditionalProperties().get("prop").getState());
    }

    @Test
    public void testSpreadModelArray() {
        Map<String, List<ModelForRecord>> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", Arrays.asList(new ModelForRecord("ok"), new ModelForRecord("ok")));
        SpreadModelArrayRecord body = new SpreadModelArrayRecord(Arrays.asList(new ModelForRecord("ok"), new ModelForRecord("ok")));
        body.setAdditionalProperties(propertyMap);
        spreadModelArrayClient.put(body);

        SpreadModelArrayRecord record = spreadModelArrayClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertNotNull(record.getKnownProp());
        record.getKnownProp().forEach(modelForRecord ->
                Assertions.assertEquals("ok", modelForRecord.getState()));
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop"));
        record.getAdditionalProperties().get("prop").forEach(modelForRecord ->
                Assertions.assertEquals("ok", modelForRecord.getState()));
    }

    @Test
    public void testSpreadDifferentString() {
        Map<String, String> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", "abc");
        DifferentSpreadStringRecord body = new DifferentSpreadStringRecord(43.125);
        body.setAdditionalProperties(propertyMap);
        spreadDifferentStringClient.put(body);

        DifferentSpreadStringRecord record = spreadDifferentStringClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals(43.125, record.getId());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertEquals("abc", record.getAdditionalProperties().get("prop"));
    }

    @Test
    public void testSpreadDifferentFloat() {
        Map<String, Double> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", 43.125);
        DifferentSpreadFloatRecord body = new DifferentSpreadFloatRecord("abc");
        body.setAdditionalProperties(propertyMap);
        spreadDifferentFloatClient.put(body);

        DifferentSpreadFloatRecord record = spreadDifferentFloatClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals("abc", record.getName());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertEquals(43.125, record.getAdditionalProperties().get("prop"));
    }

    @Test
    public void testSpreadDifferentModel() {
        Map<String, ModelForRecord> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", new ModelForRecord("ok"));
        DifferentSpreadModelRecord body = new DifferentSpreadModelRecord("abc");
        body.setAdditionalProperties(propertyMap);
        spreadDifferentModelClient.put(body);

        DifferentSpreadModelRecord record = spreadDifferentModelClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals("abc", record.getKnownProp());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop"));
        Assertions.assertEquals("ok", record.getAdditionalProperties().get("prop").getState());
    }

    @Test
    public void testSpreadDifferentModelArray() {
        Map<String, List<ModelForRecord>> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", Arrays.asList(new ModelForRecord("ok"), new ModelForRecord("ok")));
        DifferentSpreadModelArrayRecord body = new DifferentSpreadModelArrayRecord("abc");
        body.setAdditionalProperties(propertyMap);
        spreadDifferentModelArrayClient.put(body);

        DifferentSpreadModelArrayRecord record = spreadDifferentModelArrayClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals("abc", record.getKnownProp());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop"));
        record.getAdditionalProperties().get("prop").forEach(modelForRecord ->
                Assertions.assertEquals("ok", modelForRecord.getState()));
    }

    @Test
    public void testSpreadRecordUnion() {
        Map<String, BinaryData> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop1", BinaryData.fromObject("abc"));
        propertyMap.put("prop2", BinaryData.fromObject(43.125f));
        SpreadRecordForUnion body = new SpreadRecordForUnion(true);
        body.setAdditionalProperties(propertyMap);
        spreadRecordUnionClient.put(body);

        SpreadRecordForUnion record = spreadRecordUnionClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertTrue(record.isFlag());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop1"));
        Assertions.assertEquals("abc", record.getAdditionalProperties().get("prop1").toObject(String.class));
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop2"));
        Assertions.assertEquals(43.125f, record.getAdditionalProperties().get("prop2").toObject(Float.class));
    }

    @Test
    public void testSpreadRecordDiscriminatedUnion() {
        BinaryData binaryDataProp1 = BinaryData.fromObject(new WidgetData0("abc"));
        BinaryData binaryDataProp2 = BinaryData.fromObject(new WidgetData1(OffsetDateTime.parse("2021-01-01T00:00:00Z"))
                .setEnd(OffsetDateTime.parse("2021-01-02T00:00:00Z")));
        Map<String, BinaryData> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop1", binaryDataProp1);
        propertyMap.put("prop2", binaryDataProp2);
        SpreadRecordForDiscriminatedUnion body = new SpreadRecordForDiscriminatedUnion("abc");
        body.setAdditionalProperties(propertyMap);
        spreadRecordDiscriminatedUnionClient.put(body);

        SpreadRecordForDiscriminatedUnion record = spreadRecordDiscriminatedUnionClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals("abc", record.getName());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop1"));
        Assertions.assertEquals(binaryDataProp1.toObject(Map.class),
                record.getAdditionalProperties().get("prop1").toObject(Map.class));
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop2"));
        Assertions.assertEquals(binaryDataProp2.toObject(Map.class),
                record.getAdditionalProperties().get("prop2").toObject(Map.class));
    }

    @Test
    public void testSpreadRecordNonDiscriminatedUnion() {
        BinaryData binaryDataProp1 = BinaryData.fromObject(new WidgetData0("abc"));
        BinaryData binaryDataProp2 = BinaryData.fromObject(new WidgetData1(OffsetDateTime.parse("2021-01-01T00:00:00Z"))
                .setEnd(OffsetDateTime.parse("2021-01-02T00:00:00Z")));
        Map<String, BinaryData> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop1", binaryDataProp1);
        propertyMap.put("prop2", binaryDataProp2);
        SpreadRecordForNonDiscriminatedUnion body = new SpreadRecordForNonDiscriminatedUnion("abc");
        body.setAdditionalProperties(propertyMap);
        spreadRecordNonDiscriminatedUnionClient.put(body);

        SpreadRecordForNonDiscriminatedUnion record = spreadRecordNonDiscriminatedUnionClient.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals("abc", record.getName());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop1"));
        Assertions.assertEquals(binaryDataProp1.toObject(Map.class),
                record.getAdditionalProperties().get("prop1").toObject(Map.class));
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop2"));
        Assertions.assertEquals(binaryDataProp2.toObject(Map.class),
                record.getAdditionalProperties().get("prop2").toObject(Map.class));
    }

    @Test
    public void testSpreadRecordNonDiscriminatedUnion2() {
        BinaryData binaryDataProp1 = BinaryData.fromObject(new WidgetData2("2021-01-01T00:00:00Z"));
        BinaryData binaryDataProp2 = BinaryData.fromObject(new WidgetData1(OffsetDateTime.parse("2021-01-01T00:00:00Z"))
                .setEnd(OffsetDateTime.parse("2021-01-02T00:00:00Z")));
        Map<String, BinaryData> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop1", binaryDataProp1);
        propertyMap.put("prop2", binaryDataProp2);
        SpreadRecordForNonDiscriminatedUnion2 body = new SpreadRecordForNonDiscriminatedUnion2("abc");
        body.setAdditionalProperties(propertyMap);
        spreadRecordNonDiscriminatedUnion2Client.put(body);

        SpreadRecordForNonDiscriminatedUnion2 record = spreadRecordNonDiscriminatedUnion2Client.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals("abc", record.getName());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop1"));
        Assertions.assertEquals(binaryDataProp1.toObject(Map.class),
                record.getAdditionalProperties().get("prop1").toObject(Map.class));
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop2"));
        Assertions.assertEquals(binaryDataProp2.toObject(Map.class),
                record.getAdditionalProperties().get("prop2").toObject(Map.class));
    }

    @Test
    public void testSpreadRecordNonDiscriminatedUnion3() {
        BinaryData binaryDataProp1 = BinaryData.fromObject(Arrays.asList(
                new WidgetData2("2021-01-01T00:00:00Z"),
                new WidgetData2("2021-01-01T00:00:00Z")));
        BinaryData binaryDataProp2 = BinaryData.fromObject(
                new WidgetData1(OffsetDateTime.parse("2021-01-01T00:00:00Z"))
                        .setEnd(OffsetDateTime.parse("2021-01-02T00:00:00Z")));
        Map<String, BinaryData> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop1", binaryDataProp1);
        propertyMap.put("prop2", binaryDataProp2);
        SpreadRecordForNonDiscriminatedUnion3 body = new SpreadRecordForNonDiscriminatedUnion3("abc");
        body.setAdditionalProperties(propertyMap);
        spreadRecordNonDiscriminatedUnion3Client.put(body);

        SpreadRecordForNonDiscriminatedUnion3 record = spreadRecordNonDiscriminatedUnion3Client.get();
        Assertions.assertNotNull(record);
        Assertions.assertEquals("abc", record.getName());
        Assertions.assertNotNull(record.getAdditionalProperties());
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop1"));
        Assertions.assertIterableEquals(binaryDataProp1.toObject(List.class),
                record.getAdditionalProperties().get("prop1").toObject(List.class));
        Assertions.assertNotNull(record.getAdditionalProperties().get("prop2"));
        Assertions.assertEquals(binaryDataProp2.toObject(Map.class),
                record.getAdditionalProperties().get("prop2").toObject(Map.class));
    }
}
