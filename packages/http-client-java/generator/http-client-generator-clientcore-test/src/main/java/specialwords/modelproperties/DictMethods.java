package specialwords.modelproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The DictMethods model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class DictMethods implements JsonSerializable<DictMethods> {
    /*
     * The keys property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String keys;

    /*
     * The items property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String items;

    /*
     * The values property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String values;

    /*
     * The popitem property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String popitem;

    /*
     * The clear property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String clear;

    /*
     * The update property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String update;

    /*
     * The setdefault property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String setdefault;

    /*
     * The pop property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String pop;

    /*
     * The get property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String get;

    /*
     * The copy property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String copy;

    /**
     * Creates an instance of DictMethods class.
     * 
     * @param keys the keys value to set.
     * @param items the items value to set.
     * @param values the values value to set.
     * @param popitem the popitem value to set.
     * @param clear the clear value to set.
     * @param update the update value to set.
     * @param setdefault the setdefault value to set.
     * @param pop the pop value to set.
     * @param get the get value to set.
     * @param copy the copy value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DictMethods(String keys, String items, String values, String popitem, String clear, String update,
        String setdefault, String pop, String get, String copy) {
        this.keys = keys;
        this.items = items;
        this.values = values;
        this.popitem = popitem;
        this.clear = clear;
        this.update = update;
        this.setdefault = setdefault;
        this.pop = pop;
        this.get = get;
        this.copy = copy;
    }

    /**
     * Get the keys property: The keys property.
     * 
     * @return the keys value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getKeys() {
        return this.keys;
    }

    /**
     * Get the items property: The items property.
     * 
     * @return the items value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getItems() {
        return this.items;
    }

    /**
     * Get the values property: The values property.
     * 
     * @return the values value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getValues() {
        return this.values;
    }

    /**
     * Get the popitem property: The popitem property.
     * 
     * @return the popitem value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getPopitem() {
        return this.popitem;
    }

    /**
     * Get the clear property: The clear property.
     * 
     * @return the clear value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getClear() {
        return this.clear;
    }

    /**
     * Get the update property: The update property.
     * 
     * @return the update value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getUpdate() {
        return this.update;
    }

    /**
     * Get the setdefault property: The setdefault property.
     * 
     * @return the setdefault value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getSetdefault() {
        return this.setdefault;
    }

    /**
     * Get the pop property: The pop property.
     * 
     * @return the pop value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getPop() {
        return this.pop;
    }

    /**
     * Get the get property: The get property.
     * 
     * @return the get value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getGet() {
        return this.get;
    }

    /**
     * Get the copy property: The copy property.
     * 
     * @return the copy value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getCopy() {
        return this.copy;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("keys", this.keys);
        jsonWriter.writeStringField("items", this.items);
        jsonWriter.writeStringField("values", this.values);
        jsonWriter.writeStringField("popitem", this.popitem);
        jsonWriter.writeStringField("clear", this.clear);
        jsonWriter.writeStringField("update", this.update);
        jsonWriter.writeStringField("setdefault", this.setdefault);
        jsonWriter.writeStringField("pop", this.pop);
        jsonWriter.writeStringField("get", this.get);
        jsonWriter.writeStringField("copy", this.copy);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DictMethods from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DictMethods if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DictMethods.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static DictMethods fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String keys = null;
            String items = null;
            String values = null;
            String popitem = null;
            String clear = null;
            String update = null;
            String setdefault = null;
            String pop = null;
            String get = null;
            String copy = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("keys".equals(fieldName)) {
                    keys = reader.getString();
                } else if ("items".equals(fieldName)) {
                    items = reader.getString();
                } else if ("values".equals(fieldName)) {
                    values = reader.getString();
                } else if ("popitem".equals(fieldName)) {
                    popitem = reader.getString();
                } else if ("clear".equals(fieldName)) {
                    clear = reader.getString();
                } else if ("update".equals(fieldName)) {
                    update = reader.getString();
                } else if ("setdefault".equals(fieldName)) {
                    setdefault = reader.getString();
                } else if ("pop".equals(fieldName)) {
                    pop = reader.getString();
                } else if ("get".equals(fieldName)) {
                    get = reader.getString();
                } else if ("copy".equals(fieldName)) {
                    copy = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new DictMethods(keys, items, values, popitem, clear, update, setdefault, pop, get, copy);
        });
    }
}
