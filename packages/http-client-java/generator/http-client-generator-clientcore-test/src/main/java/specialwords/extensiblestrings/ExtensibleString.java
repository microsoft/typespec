package specialwords.extensiblestrings;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import io.clientcore.core.utils.ExpandableEnum;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

/**
 * Verify enum member names that are special words using extensible enum (union).
 */
public final class ExtensibleString implements ExpandableEnum<String>, JsonSerializable<ExtensibleString> {
    private static final Map<String, ExtensibleString> VALUES = new ConcurrentHashMap<>();

    private static final Function<String, ExtensibleString> NEW_INSTANCE = ExtensibleString::new;

    /**
     * Static value and for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString AND = fromValue("and");

    /**
     * Static value as for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString AS = fromValue("as");

    /**
     * Static value assert for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString ASSERT = fromValue("assert");

    /**
     * Static value async for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString ASYNC = fromValue("async");

    /**
     * Static value await for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString AWAIT = fromValue("await");

    /**
     * Static value break for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString BREAK = fromValue("break");

    /**
     * Static value class for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString CLASS = fromValue("class");

    /**
     * Static value constructor for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString CONSTRUCTOR = fromValue("constructor");

    /**
     * Static value continue for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString CONTINUE = fromValue("continue");

    /**
     * Static value def for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString DEF = fromValue("def");

    /**
     * Static value del for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString DEL = fromValue("del");

    /**
     * Static value elif for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString ELIF = fromValue("elif");

    /**
     * Static value else for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString ELSE = fromValue("else");

    /**
     * Static value except for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString EXCEPT = fromValue("except");

    /**
     * Static value exec for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString EXEC = fromValue("exec");

    /**
     * Static value finally for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString FINALLY = fromValue("finally");

    /**
     * Static value for for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString FOR = fromValue("for");

    /**
     * Static value from for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString FROM = fromValue("from");

    /**
     * Static value global for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString GLOBAL = fromValue("global");

    /**
     * Static value if for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString IF = fromValue("if");

    /**
     * Static value import for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString IMPORT = fromValue("import");

    /**
     * Static value in for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString IN = fromValue("in");

    /**
     * Static value is for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString IS = fromValue("is");

    /**
     * Static value lambda for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString LAMBDA = fromValue("lambda");

    /**
     * Static value not for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString NOT = fromValue("not");

    /**
     * Static value or for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString OR = fromValue("or");

    /**
     * Static value pass for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString PASS = fromValue("pass");

    /**
     * Static value raise for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString RAISE = fromValue("raise");

    /**
     * Static value return for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString RETURN = fromValue("return");

    /**
     * Static value try for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString TRY = fromValue("try");

    /**
     * Static value while for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString WHILE = fromValue("while");

    /**
     * Static value with for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString WITH = fromValue("with");

    /**
     * Static value yield for ExtensibleString.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ExtensibleString YIELD = fromValue("yield");

    private final String value;

    private ExtensibleString(String value) {
        this.value = value;
    }

    /**
     * Creates or finds a ExtensibleString.
     * 
     * @param value a value to look for.
     * @return the corresponding ExtensibleString.
     * @throws IllegalArgumentException if value is null.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ExtensibleString fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("'value' cannot be null.");
        }
        return VALUES.computeIfAbsent(value, NEW_INSTANCE);
    }

    /**
     * Gets known ExtensibleString values.
     * 
     * @return Known ExtensibleString values.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Collection<ExtensibleString> values() {
        return new ArrayList<>(VALUES.values());
    }

    /**
     * Gets the value of the ExtensibleString instance.
     * 
     * @return the value of the ExtensibleString instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public String getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeString(getValue());
    }

    /**
     * Reads an instance of ExtensibleString from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ExtensibleString if the JsonReader was pointing to an instance of it, or null if the
     * JsonReader was pointing to JSON null.
     * @throws IOException If an error occurs while reading the ExtensibleString.
     * @throws IllegalStateException If unexpected JSON token is found.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ExtensibleString fromJson(JsonReader jsonReader) throws IOException {
        JsonToken nextToken = jsonReader.nextToken();
        if (nextToken == JsonToken.NULL) {
            return null;
        }
        if (nextToken != JsonToken.STRING) {
            throw new IllegalStateException(
                String.format("Unexpected JSON token for %s deserialization: %s", JsonToken.STRING, nextToken));
        }
        return ExtensibleString.fromValue(jsonReader.getString());
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public String toString() {
        return Objects.toString(this.value);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public boolean equals(Object obj) {
        return this == obj;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public int hashCode() {
        return Objects.hashCode(this.value);
    }
}
