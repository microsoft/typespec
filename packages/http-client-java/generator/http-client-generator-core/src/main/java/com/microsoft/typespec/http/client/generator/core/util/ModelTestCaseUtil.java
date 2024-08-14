// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.azure.core.util.CoreUtils;
import com.azure.core.util.DateTimeRfc1123;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

public class ModelTestCaseUtil {

    private static final class Configuration {
        private final float nullableProbability = 0.0f;

        private final int maxDepth = 5;

        private final int maxStringLen = 16 + 1;
        private final int maxList = 4 + 1;
        private final int maxDict = 4 + 1;
    }

    private static final Random RANDOM = new Random(3);
    private static final Configuration CONFIGURATION = new Configuration();

    /**
     * Compose a random JSON object according to the structure of client model.
     *
     * @param model the client model
     * @return the JSON object as Map
     */
    public static Map<String, Object> jsonFromModel(ClientModel model) {
        return jsonFromModel(0, model);
    }

    private static Map<String, Object> jsonFromModel(int depth, ClientModel model) {
        Map<String, Object> jsonObject = new LinkedHashMap<>();

        // polymorphism
        if (model.isPolymorphic()) {
            addForProperty(jsonObject,
                    model.getPolymorphicDiscriminatorName(), model.getNeedsFlatten(),
                    model.getSerializedName());
        }

        // class
        for (ClientModelProperty property : model.getProperties()) {
            if (!property.isPolymorphicDiscriminator()) {
                addForProperty(depth, jsonObject, property, model.getNeedsFlatten());
            }
        }

        // superclasses
        String parentModelName = model.getParentModelName();
        while (!CoreUtils.isNullOrEmpty(parentModelName)) {
            ClientModel parentModel = ClientModelUtil.getClientModel(parentModelName);
            if (parentModel != null) {
                for (ClientModelProperty property : parentModel.getProperties()) {
                    if (!property.isPolymorphicDiscriminator()) {
                        addForProperty(depth, jsonObject, property, parentModel.getNeedsFlatten());
                    }
                }
            }
            parentModelName = parentModel == null ? null : parentModel.getParentModelName();
        }

        return jsonObject;
    }

    /**
     * Compose a random JSON object according to the structure of client model.
     *
     * @param depth the current depth of the object from its root
     * @param type the type
     * @return the JSON object as Map
     */
    public static Object jsonFromType(int depth, IType type) {
        if (type.asNullable() == ClassType.INTEGER) {
            return RANDOM.nextInt() & Integer.MAX_VALUE;
        } else if (type.asNullable() == ClassType.LONG) {
            return RANDOM.nextLong() & Long.MAX_VALUE;
        } else if (type.asNullable() == ClassType.FLOAT) {
            return RANDOM.nextFloat() * 100;
        } else if (type.asNullable() == ClassType.DOUBLE) {
            return RANDOM.nextDouble() * 100;
        } else if (type.asNullable() == ClassType.BOOLEAN) {
            return RANDOM.nextBoolean();
        } else if (type == ClassType.STRING) {
            return randomString();
        } else if (type.asNullable() == ClassType.UNIX_TIME_LONG) {
            return RANDOM.nextLong() & Long.MAX_VALUE;
        } else if (type == ClassType.DATE_TIME) {
            return randomDateTime().toString();
        } else if (type == ClassType.DATE_TIME_RFC_1123) {
            return DateTimeRfc1123.toRfc1123String(randomDateTime());
        } else if (type == ClassType.DURATION) {
            Duration duration = Duration.ZERO;
            duration = duration.plusSeconds(RANDOM.nextInt(10 * 24 * 60 * 60));
            return duration.toString();
        } else if (type.asNullable() == ClassType.DURATION_LONG) {
            return RANDOM.nextLong() & Long.MAX_VALUE;
        } else if (type.asNullable() == ClassType.DURATION_DOUBLE) {
            return Math.abs(RANDOM.nextDouble() * 10);
        } else if (type == ClassType.UUID) {
            return UUID.randomUUID().toString();
        } else if (type == ClassType.URL) {
            return  "http://example.org/" + URLEncoder.encode(randomString(), StandardCharsets.UTF_8);
        } else if (type == ClassType.OBJECT) {
            // unknown type, use a simple string
            return "data" + randomString();
        } else if (type instanceof EnumType) {
            IType elementType = ((EnumType) type).getElementType();
            List<String> values = ((EnumType) type).getValues().stream().map(ClientEnumValue::getValue).collect(Collectors.toList());
            if (values.isEmpty()) {
                // empty enum
                return null;
            }
            int index = RANDOM.nextInt(values.size());
            String value = values.get(index);
            if (elementType.asNullable() == ClassType.INTEGER) {
                return Integer.valueOf(value);
            } else if (elementType.asNullable() == ClassType.LONG) {
                return Long.valueOf(value);
            } else if (elementType.asNullable() == ClassType.FLOAT) {
                return Float.valueOf(value);
            } else if (elementType.asNullable() == ClassType.DOUBLE) {
                return Double.valueOf(value);
            } else if (elementType.asNullable() == ClassType.BOOLEAN) {
                return Boolean.valueOf(value);
            } else if (elementType == ClassType.STRING) {
                return value;
            }
        } else if (type instanceof ListType) {
            List<Object> list = new ArrayList<>();
            if (depth <= CONFIGURATION.maxDepth) {
                IType elementType = ((ListType) type).getElementType();
                int count = RANDOM.nextInt(CONFIGURATION.maxList - 1) + 1;
                for (int i = 0; i < count; ++i) {
                    Object element = jsonFromType(depth + 1, elementType);
                    if (element != null) {
                        list.add(element);
                    }
                }
            } // else abort
            return list;
        } else if (type instanceof MapType) {
            Map<String, Object> map = new LinkedHashMap<>();
            if (depth <= CONFIGURATION.maxDepth) {
                IType elementType = ((MapType) type).getValueType();
                int count = RANDOM.nextInt(CONFIGURATION.maxDict - 1) + 1;
                for (int i = 0; i < count; ++i) {
                    Object element = jsonFromType(depth + 1, elementType);
                    if (element != null) {
                        map.put(randomString(), element);
                    }
                }
            } // else abort
            return map;
        } else if (type instanceof ClassType && type != ClassType.CONTEXT) {
            ClientModel model = ClientModelUtil.getClientModel(((ClassType) type).getName());
            if (model != null) {
                return jsonFromModel(depth + 1, model);
            }
        }
        return null;
    }


    public static String redactStringValue(List<String> serializedNames, String value) {
        for (String keyName : serializedNames) {
            String keyNameLower = keyName.toLowerCase(Locale.ROOT);
            for (String key : POSSIBLE_CREDENTIAL_KEY) {
                if (keyNameLower.contains(key)) {
                    value = "fakeTokenPlaceholder";
                    break;
                }
            }
        }
        return value;
    }

    private static void addForProperty(int depth, Map<String, Object> jsonObject,
                                       ClientModelProperty property, boolean modelNeedsFlatten) {
        final boolean maxDepthReached = depth > CONFIGURATION.maxDepth;

        Object value = null;
        if (property.isConstant()) {
            // TODO (weidxu): skip for now, as the property.getDefaultValue() is the code, not the raw data
            //value = property.getDefaultValue();
            return;
        } else {
            if (property.isRequired()
                    // required property must be generated
                    // optional property only be generated when still have depth remains
                    // we assume here that there is no infinitely nested required properties
                    || (!maxDepthReached && RANDOM.nextFloat() > CONFIGURATION.nullableProbability)) {
                value = jsonFromType(depth, property.getWireType());
            }
        }

        addForProperty(jsonObject,
                property.getSerializedName(), modelNeedsFlatten || property.getNeedsFlatten(),
                value);
    }

    private static void addForProperty(Map<String, Object> jsonObject,
                                       String serializedName, boolean modelNeedsFlatten,
                                       Object value) {
        if (value != null) {
            List<String> serializedNames;
            if (modelNeedsFlatten) {
                serializedNames = ClientModelUtil.splitFlattenedSerializedName(serializedName);
            } else {
                serializedNames = Collections.singletonList(serializedName);
            }
            addToJsonObject(jsonObject, serializedNames, value);
        }
    }

    @SuppressWarnings("unchecked")
    private static void addToJsonObject(Map<String, Object> jsonObject, List<String> serializedNames, Object value) {
        checkCredential(serializedNames);

        if (serializedNames.size() == 1) {
            jsonObject.put(serializedNames.iterator().next(), value);
        } else {
            serializedNames = new ArrayList<>(serializedNames);
            String serializedName = serializedNames.iterator().next();
            serializedNames.remove(0);
            if (jsonObject.containsKey(serializedName)) {
                Object nextJsonObject = jsonObject.get(serializedName);
                if (nextJsonObject instanceof Map) {
                    addToJsonObject((Map<String, Object>) nextJsonObject, serializedNames, value);
                }
            } else {
                Map<String, Object> nextJsonObject = new LinkedHashMap<>();
                jsonObject.put(serializedName, nextJsonObject);
                addToJsonObject(nextJsonObject, serializedNames, value);
            }
        }
    }

    private static final List<String> POSSIBLE_CREDENTIAL_KEY = Arrays.asList(
            "key",
            "code",
            "credential",
            "password",
            "token",
            "secret",
            "authorization"
    );

    private static void checkCredential(List<String> serializedNames) {
        for (String keyName : serializedNames) {
            String keyNameLower = keyName.toLowerCase(Locale.ROOT);
            for (String key : POSSIBLE_CREDENTIAL_KEY) {
                if (keyNameLower.contains(key)) {
                    throw new PossibleCredentialException(keyName);
                }
            }
        }
    }

    private static String randomString() {
        int leftLimit = 97; // letter 'a'
        int rightLimit = 122; // letter 'z'
        int targetStringLength = RANDOM.nextInt(CONFIGURATION.maxStringLen - 1) + 1;

        return RANDOM.ints(leftLimit, rightLimit + 1)
                .limit(targetStringLength)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }


    private static final OffsetDateTime TIME = OffsetDateTime.parse("2020-12-20T00:00:00.000Z");
    private static OffsetDateTime randomDateTime() {
        return TIME.plusSeconds(RANDOM.nextInt(356 * 24 * 60 * 60));
    }
}
