// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents the full set of schemas for a given service, categorized into convenient collections.
 */
public class Schemas implements JsonSerializable<Schemas> {
    private List<ArraySchema> arrays = new ArrayList<>();
    private List<DictionarySchema> dictionaries = new ArrayList<>();
    private List<BinarySchema> binaries = new ArrayList<>();
    private List<ObjectSchema> groups = new ArrayList<>();
    private List<BooleanSchema> booleans = new ArrayList<>();
    private List<NumberSchema> numbers = new ArrayList<>();
    private List<ObjectSchema> objects = new ArrayList<>();
    private List<StringSchema> strings = new ArrayList<>();
    private List<UnixTimeSchema> unixtimes = new ArrayList<>();
    private List<ByteArraySchema> byteArrays = new ArrayList<>();
    private List<Schema> streams = new ArrayList<>();
    private List<CharSchema> chars = new ArrayList<>();
    private List<DateSchema> dates = new ArrayList<>();
    private List<DateTimeSchema> dateTimes = new ArrayList<>();
    private List<DurationSchema> durations = new ArrayList<>();
    private List<UuidSchema> uuids = new ArrayList<>();
    private List<UriSchema> uris = new ArrayList<>();
    private List<CredentialSchema> credentials = new ArrayList<>();
    private List<ODataQuerySchema> odataQueries = new ArrayList<>();
    private List<ChoiceSchema> choices = new ArrayList<>();
    private List<SealedChoiceSchema> sealedChoices = new ArrayList<>();
    private List<FlagSchema> flags = new ArrayList<>();
    private List<ConstantSchema> constants = new ArrayList<>();
    private List<AndSchema> ands = new ArrayList<>();
    private List<OrSchema> ors = new ArrayList<>();
    private List<XorSchema> xors = new ArrayList<>();
    private List<Schema> unknowns = new ArrayList<>();
    private List<ParameterGroupSchema> parameterGroups = new ArrayList<>();

    /**
     * Creates a new instance of the Schemas class.
     */
    public Schemas() {
    }

    /**
     * Gets the list of array schemas.
     *
     * @return The list of array schemas.
     */
    public List<ArraySchema> getArrays() {
        return arrays;
    }

    /**
     * Sets the list of array schemas.
     *
     * @param arrays The list of array schemas.
     */
    public void setArrays(List<ArraySchema> arrays) {
        this.arrays = arrays;
    }

    /**
     * Gets the list of dictionary schemas.
     *
     * @return The list of dictionary schemas.
     */
    public List<DictionarySchema> getDictionaries() {
        return dictionaries;
    }

    /**
     * Sets the list of dictionary schemas.
     *
     * @param dictionaries The list of dictionary schemas.
     */
    public void setDictionaries(List<DictionarySchema> dictionaries) {
        this.dictionaries = dictionaries;
    }

    /**
     * Gets the list of boolean schemas.
     *
     * @return The list of boolean schemas.
     */
    public List<BooleanSchema> getBooleans() {
        return booleans;
    }

    /**
     * Sets the list of boolean schemas.
     *
     * @param booleans The list of boolean schemas.
     */
    public void setBooleans(List<BooleanSchema> booleans) {
        this.booleans = booleans;
    }

    /**
     * Gets the list of number schemas.
     *
     * @return The list of number schemas.
     */
    public List<NumberSchema> getNumbers() {
        return numbers;
    }

    /**
     * Sets the list of number schemas.
     *
     * @param numbers The list of number schemas.
     */
    public void setNumbers(List<NumberSchema> numbers) {
        this.numbers = numbers;
    }

    /**
     * Gets the list of object schemas.
     *
     * @return The list of object schemas.
     */
    public List<ObjectSchema> getObjects() {
        return objects;
    }

    /**
     * Sets the list of object schemas.
     *
     * @param objects The list of object schemas.
     */
    public void setObjects(List<ObjectSchema> objects) {
        this.objects = objects;
    }

    /**
     * Gets the list of string schemas.
     *
     * @return The list of string schemas.
     */
    public List<StringSchema> getStrings() {
        return strings;
    }

    /**
     * Sets the list of string schemas.
     *
     * @param strings The list of string schemas.
     */
    public void setStrings(List<StringSchema> strings) {
        this.strings = strings;
    }

    /**
     * Gets the list of UnixTime schemas.
     *
     * @return The list of UnixTime schemas.
     */
    public List<UnixTimeSchema> getUnixtimes() {
        return unixtimes;
    }

    /**
     * Sets the list of UnixTime schemas.
     *
     * @param unixtimes The list of UnixTime schemas.
     */
    public void setUnixtimes(List<UnixTimeSchema> unixtimes) {
        this.unixtimes = unixtimes;
    }

    /**
     * Gets the list of ByteArray schemas.
     *
     * @return The list of ByteArray schemas.
     */
    public List<ByteArraySchema> getByteArrays() {
        return byteArrays;
    }

    /**
     * Sets the list of ByteArray schemas.
     *
     * @param byteArrays The list of ByteArray schemas.
     */
    public void setByteArrays(List<ByteArraySchema> byteArrays) {
        this.byteArrays = byteArrays;
    }

    /**
     * Gets the list of streams.
     *
     * @return The list of streams.
     */
    public List<Schema> getStreams() {
        return streams;
    }

    /**
     * Sets the list of streams.
     *
     * @param streams The list of streams.
     */
    public void setStreams(List<Schema> streams) {
        this.streams = streams;
    }

    /**
     * Gets the list of Char schemas.
     *
     * @return The list of Char schemas.
     */
    public List<CharSchema> getChars() {
        return chars;
    }

    /**
     * Sets the list of Char schemas.
     *
     * @param chars The list of Char schemas.
     */
    public void setChars(List<CharSchema> chars) {
        this.chars = chars;
    }

    /**
     * Gets the list of Date schemas.
     *
     * @return The list of Date schemas.
     */
    public List<DateSchema> getDates() {
        return dates;
    }

    /**
     * Sets the list of Date schemas.
     *
     * @param dates The list of Date schemas.
     */
    public void setDates(List<DateSchema> dates) {
        this.dates = dates;
    }

    /**
     * Gets the list of DateTime schemas.
     *
     * @return The list of DateTime schemas.
     */
    public List<DateTimeSchema> getDateTimes() {
        return dateTimes;
    }

    /**
     * Sets the list of DateTime schemas.
     *
     * @param dateTimes The list of DateTime schemas.
     */
    public void setDateTimes(List<DateTimeSchema> dateTimes) {
        this.dateTimes = dateTimes;
    }

    /**
     * Gets the list of Duration schemas.
     *
     * @return The list of Duration schemas.
     */
    public List<DurationSchema> getDurations() {
        return durations;
    }

    /**
     * Sets the list of Duration schemas.
     *
     * @param durations The list of Duration schemas.
     */
    public void setDurations(List<DurationSchema> durations) {
        this.durations = durations;
    }

    /**
     * Gets the list of Uuid schemas.
     *
     * @return The list of Uuid schemas.
     */
    public List<UuidSchema> getUuids() {
        return uuids;
    }

    /**
     * Sets the list of Uuid schemas.
     *
     * @param uuids The list of Uuid schemas.
     */
    public void setUuids(List<UuidSchema> uuids) {
        this.uuids = uuids;
    }

    /**
     * Gets the list of Uri schemas.
     *
     * @return The list of Uri schemas.
     */
    public List<UriSchema> getUris() {
        return uris;
    }

    /**
     * Sets the list of Uri schemas.
     *
     * @param uris The list of Uri schemas.
     */
    public void setUris(List<UriSchema> uris) {
        this.uris = uris;
    }

    /**
     * Gets the list of Credential schemas.
     *
     * @return The list of Credential schemas.
     */
    public List<CredentialSchema> getCredentials() {
        return credentials;
    }

    /**
     * Sets the list of Credential schemas.
     *
     * @param credentials The list of Credential schemas.
     */
    public void setCredentials(List<CredentialSchema> credentials) {
        this.credentials = credentials;
    }

    /**
     * Gets the list of ODataQuery schemas.
     *
     * @return The list of ODataQuery schemas.
     */
    public List<ODataQuerySchema> getOdataQueries() {
        return odataQueries;
    }

    /**
     * Sets the list of ODataQuery schemas.
     *
     * @param odataQueries The list of ODataQuery schemas.
     */
    public void setOdataQueries(List<ODataQuerySchema> odataQueries) {
        this.odataQueries = odataQueries;
    }

    /**
     * Gets the list of Choice schemas.
     *
     * @return The list of Choice schemas.
     */
    public List<ChoiceSchema> getChoices() {
        return choices;
    }

    /**
     * Sets the list of Choice schemas.
     *
     * @param choices The list of Choice schemas.
     */
    public void setChoices(List<ChoiceSchema> choices) {
        this.choices = choices;
    }

    /**
     * Gets the list of SealedChoice schemas.
     *
     * @return The list of SealedChoice schemas.
     */
    public List<SealedChoiceSchema> getSealedChoices() {
        return sealedChoices;
    }

    /**
     * Sets the list of SealedChoice schemas.
     *
     * @param sealedChoices The list of SealedChoice schemas.
     */
    public void setSealedChoices(List<SealedChoiceSchema> sealedChoices) {
        this.sealedChoices = sealedChoices;
    }

    /**
     * Gets the list of Flag schemas.
     *
     * @return The list of Flag schemas.
     */
    public List<FlagSchema> getFlags() {
        return flags;
    }

    /**
     * Sets the list of Flag schemas.
     *
     * @param flags The list of Flag schemas.
     */
    public void setFlags(List<FlagSchema> flags) {
        this.flags = flags;
    }

    /**
     * Gets the list of Constant schemas.
     *
     * @return The list of Constant schemas.
     */
    public List<ConstantSchema> getConstants() {
        return constants;
    }

    /**
     * Sets the list of Constant schemas.
     *
     * @param constants The list of Constant schemas.
     */
    public void setConstants(List<ConstantSchema> constants) {
        this.constants = constants;
    }

    /**
     * Gets the list of And schemas.
     *
     * @return The list of And schemas.
     */
    public List<AndSchema> getAnds() {
        return ands;
    }

    /**
     * Sets the list of And schemas.
     *
     * @param ands The list of And schemas.
     */
    public void setAnds(List<AndSchema> ands) {
        this.ands = ands;
    }

    /**
     * Gets the list of Or schemas.
     *
     * @return The list of Or schemas.
     */
    public List<OrSchema> getOrs() {
        return ors;
    }

    /**
     * Sets the list of Or schemas.
     *
     * @param ors The list of Or schemas.
     */
    public void setOrs(List<OrSchema> ors) {
        this.ors = ors;
    }

    /**
     * Gets the list of Xor schemas.
     *
     * @return The list of Xor schemas.
     */
    public List<XorSchema> getXors() {
        return xors;
    }

    /**
     * Sets the list of Xor schemas.
     *
     * @param xors The list of Xor schemas.
     */
    public void setXors(List<XorSchema> xors) {
        this.xors = xors;
    }

    /**
     * Gets the list of unknown schemas.
     *
     * @return The list of unknown schemas.
     */
    public List<Schema> getUnknowns() {
        return unknowns;
    }

    /**
     * Sets the list of unknown schemas.
     *
     * @param unknowns The list of unknown schemas.
     */
    public void setUnknowns(List<Schema> unknowns) {
        this.unknowns = unknowns;
    }

    /**
     * Gets the list of parameter group schemas.
     *
     * @return The list of parameter group schemas.
     */
    public List<ParameterGroupSchema> getParameterGroups() {
        return parameterGroups;
    }

    /**
     * Sets the list of parameter group schemas.
     *
     * @param parameterGroups The list of parameter group schemas.
     */
    public void setParameterGroups(List<ParameterGroupSchema> parameterGroups) {
        this.parameterGroups = parameterGroups;
    }

    /**
     * Gets the list of group schemas.
     *
     * @return The list of group schemas.
     */
    public List<ObjectSchema> getGroups() {
        return groups;
    }

    /**
     * Sets the list of group schemas.
     *
     * @param groups The list of group schemas.
     */
    public void setGroups(List<ObjectSchema> groups) {
        this.groups = groups;
    }

    /**
     * Gets the list of binary schemas.
     *
     * @return The list of binary schemas.
     */
    public List<BinarySchema> getBinaries() {
        return binaries;
    }

    /**
     * Sets the list of binary schemas.
     *
     * @param binaries The list of binary schemas.
     */
    public void setBinaries(List<BinarySchema> binaries) {
        this.binaries = binaries;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeArrayField("arrays", arrays, JsonWriter::writeJson)
            .writeArrayField("dictionaries", dictionaries, JsonWriter::writeJson)
            .writeArrayField("binaries", binaries, JsonWriter::writeJson)
            .writeArrayField("groups", groups, JsonWriter::writeJson)
            .writeArrayField("booleans", booleans, JsonWriter::writeJson)
            .writeArrayField("numbers", numbers, JsonWriter::writeJson)
            .writeArrayField("objects", objects, JsonWriter::writeJson)
            .writeArrayField("strings", strings, JsonWriter::writeJson)
            .writeArrayField("unixtimes", unixtimes, JsonWriter::writeJson)
            .writeArrayField("byteArrays", byteArrays, JsonWriter::writeJson)
            .writeArrayField("streams", streams, JsonWriter::writeJson)
            .writeArrayField("chars", chars, JsonWriter::writeJson)
            .writeArrayField("dates", dates, JsonWriter::writeJson)
            .writeArrayField("dateTimes", dateTimes, JsonWriter::writeJson)
            .writeArrayField("durations", durations, JsonWriter::writeJson)
            .writeArrayField("uuids", uuids, JsonWriter::writeJson)
            .writeArrayField("uris", uris, JsonWriter::writeJson)
            .writeArrayField("credentials", credentials, JsonWriter::writeJson)
            .writeArrayField("odataQueries", odataQueries, JsonWriter::writeJson)
            .writeArrayField("choices", choices, JsonWriter::writeJson)
            .writeArrayField("sealedChoices", sealedChoices, JsonWriter::writeJson)
            .writeArrayField("flags", flags, JsonWriter::writeJson)
            .writeArrayField("constants", constants, JsonWriter::writeJson)
            .writeArrayField("ands", ands, JsonWriter::writeJson)
            .writeArrayField("ors", ors, JsonWriter::writeJson)
            .writeArrayField("xors", xors, JsonWriter::writeJson)
            .writeArrayField("unknowns", unknowns, JsonWriter::writeJson)
            .writeArrayField("parameterGroups", parameterGroups, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a Schemas instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Schemas instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Schemas fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Schemas::new, (schemas, fieldName, reader) -> {
            if ("arrays".equals(fieldName)) {
                schemas.arrays = reader.readArray(ArraySchema::fromJson);
            } else if ("dictionaries".equals(fieldName)) {
                schemas.dictionaries = reader.readArray(DictionarySchema::fromJson);
            } else if ("binaries".equals(fieldName)) {
                schemas.binaries = reader.readArray(BinarySchema::fromJson);
            } else if ("groups".equals(fieldName)) {
                schemas.groups = reader.readArray(ObjectSchema::fromJson);
            } else if ("booleans".equals(fieldName)) {
                schemas.booleans = reader.readArray(BooleanSchema::fromJson);
            } else if ("numbers".equals(fieldName)) {
                schemas.numbers = reader.readArray(NumberSchema::fromJson);
            } else if ("objects".equals(fieldName)) {
                schemas.objects = reader.readArray(ObjectSchema::fromJson);
            } else if ("strings".equals(fieldName)) {
                schemas.strings = reader.readArray(StringSchema::fromJson);
            } else if ("unixtimes".equals(fieldName)) {
                schemas.unixtimes = reader.readArray(UnixTimeSchema::fromJson);
            } else if ("byteArrays".equals(fieldName)) {
                schemas.byteArrays = reader.readArray(ByteArraySchema::fromJson);
            } else if ("streams".equals(fieldName)) {
                schemas.streams = reader.readArray(Schema::fromJson);
            } else if ("chars".equals(fieldName)) {
                schemas.chars = reader.readArray(CharSchema::fromJson);
            } else if ("dates".equals(fieldName)) {
                schemas.dates = reader.readArray(DateSchema::fromJson);
            } else if ("dateTimes".equals(fieldName)) {
                schemas.dateTimes = reader.readArray(DateTimeSchema::fromJson);
            } else if ("durations".equals(fieldName)) {
                schemas.durations = reader.readArray(DurationSchema::fromJson);
            } else if ("uuids".equals(fieldName)) {
                schemas.uuids = reader.readArray(UuidSchema::fromJson);
            } else if ("uris".equals(fieldName)) {
                schemas.uris = reader.readArray(UriSchema::fromJson);
            } else if ("credentials".equals(fieldName)) {
                schemas.credentials = reader.readArray(CredentialSchema::fromJson);
            } else if ("odataQueries".equals(fieldName)) {
                schemas.odataQueries = reader.readArray(ODataQuerySchema::fromJson);
            } else if ("choices".equals(fieldName)) {
                schemas.choices = reader.readArray(ChoiceSchema::fromJson);
            } else if ("sealedChoices".equals(fieldName)) {
                schemas.sealedChoices = reader.readArray(SealedChoiceSchema::fromJson);
            } else if ("flags".equals(fieldName)) {
                schemas.flags = reader.readArray(FlagSchema::fromJson);
            } else if ("constants".equals(fieldName)) {
                schemas.constants = reader.readArray(ConstantSchema::fromJson);
            } else if ("ands".equals(fieldName)) {
                schemas.ands = reader.readArray(AndSchema::fromJson);
            } else if ("ors".equals(fieldName)) {
                schemas.ors = reader.readArray(OrSchema::fromJson);
            } else if ("xors".equals(fieldName)) {
                schemas.xors = reader.readArray(XorSchema::fromJson);
            } else if ("unknowns".equals(fieldName)) {
                schemas.unknowns = reader.readArray(Schema::fromJson);
            } else if ("parameterGroups".equals(fieldName)) {
                schemas.parameterGroups = reader.readArray(ParameterGroupSchema::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
