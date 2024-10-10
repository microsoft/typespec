// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.enumservice.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * The Operation model.
 */
@Immutable
public final class Operation implements JsonSerializable<Operation> {
    /*
     * The name property.
     */
    @Generated
    private final OperationName name;

    /*
     * The best property.
     */
    @Generated
    private final boolean best = true;

    /*
     * The age property.
     */
    @Generated
    private final int age = 50;

    /*
     * The priority property.
     */
    @Generated
    private final Priority priority;

    /*
     * The color property.
     */
    @Generated
    private final ColorModel color;

    /*
     * The unit property.
     */
    @Generated
    private final Unit unit;

    /*
     * The priorityValue property.
     */
    @Generated
    private final Priority priorityValue = Priority.LOW;

    /*
     * The colorValue property.
     */
    @Generated
    private final Color colorValue = Color.GREEN;

    /*
     * The colorModelValue property.
     */
    @Generated
    private final ColorModel colorModelValue = ColorModel.BLUE;

    /*
     * The unitValue property.
     */
    @Generated
    private Unit unitValue;

    /**
     * Creates an instance of Operation class.
     * 
     * @param name the name value to set.
     * @param priority the priority value to set.
     * @param color the color value to set.
     * @param unit the unit value to set.
     */
    @Generated
    private Operation(OperationName name, Priority priority, ColorModel color, Unit unit) {
        this.name = name;
        this.priority = priority;
        this.color = color;
        this.unit = unit;
    }

    /**
     * Get the name property: The name property.
     * 
     * @return the name value.
     */
    @Generated
    public OperationName getName() {
        return this.name;
    }

    /**
     * Get the best property: The best property.
     * 
     * @return the best value.
     */
    @Generated
    public boolean isBest() {
        return this.best;
    }

    /**
     * Get the age property: The age property.
     * 
     * @return the age value.
     */
    @Generated
    public int getAge() {
        return this.age;
    }

    /**
     * Get the priority property: The priority property.
     * 
     * @return the priority value.
     */
    @Generated
    public Priority getPriority() {
        return this.priority;
    }

    /**
     * Get the color property: The color property.
     * 
     * @return the color value.
     */
    @Generated
    public ColorModel getColor() {
        return this.color;
    }

    /**
     * Get the unit property: The unit property.
     * 
     * @return the unit value.
     */
    @Generated
    public Unit getUnit() {
        return this.unit;
    }

    /**
     * Get the priorityValue property: The priorityValue property.
     * 
     * @return the priorityValue value.
     */
    @Generated
    public Priority getPriorityValue() {
        return this.priorityValue;
    }

    /**
     * Get the colorValue property: The colorValue property.
     * 
     * @return the colorValue value.
     */
    @Generated
    public Color getColorValue() {
        return this.colorValue;
    }

    /**
     * Get the colorModelValue property: The colorModelValue property.
     * 
     * @return the colorModelValue value.
     */
    @Generated
    public ColorModel getColorModelValue() {
        return this.colorModelValue;
    }

    /**
     * Get the unitValue property: The unitValue property.
     * 
     * @return the unitValue value.
     */
    @Generated
    public Unit getUnitValue() {
        return this.unitValue;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", this.name == null ? null : this.name.toString());
        jsonWriter.writeBooleanField("best", this.best);
        jsonWriter.writeIntField("age", this.age);
        jsonWriter.writeNumberField("priority", this.priority == null ? null : this.priority.toInt());
        jsonWriter.writeStringField("color", this.color == null ? null : this.color.toString());
        jsonWriter.writeNumberField("unit", this.unit == null ? null : this.unit.toDouble());
        jsonWriter.writeNumberField("priorityValue", this.priorityValue == null ? null : this.priorityValue.toInt());
        jsonWriter.writeStringField("colorValue", this.colorValue == null ? null : this.colorValue.toString());
        jsonWriter.writeStringField("colorModelValue",
            this.colorModelValue == null ? null : this.colorModelValue.toString());
        jsonWriter.writeNumberField("unitValue", this.unitValue == null ? null : this.unitValue.toDouble());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Operation from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Operation if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Operation.
     */
    @Generated
    public static Operation fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            OperationName name = null;
            Priority priority = null;
            ColorModel color = null;
            Unit unit = null;
            Unit unitValue = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = OperationName.fromString(reader.getString());
                } else if ("priority".equals(fieldName)) {
                    priority = Priority.fromInt(reader.getInt());
                } else if ("color".equals(fieldName)) {
                    color = ColorModel.fromString(reader.getString());
                } else if ("unit".equals(fieldName)) {
                    unit = Unit.fromDouble(reader.getDouble());
                } else if ("unitValue".equals(fieldName)) {
                    unitValue = Unit.fromDouble(reader.getDouble());
                } else {
                    reader.skipChildren();
                }
            }
            Operation deserializedOperation = new Operation(name, priority, color, unit);
            deserializedOperation.unitValue = unitValue;

            return deserializedOperation;
        });
    }
}
