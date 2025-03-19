// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.azure.core.annotation.Generated;
import com.azure.core.util.ExpandableEnum;
import io.clientcore.core.util.binarydata.BinaryData;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ClientMethodSerializeItemValueCodeTests {

    @Test
    public void testClientMethodSerializeItemValueCode() {
        // code from resources/ClientMethodSerializeItemValue.java
        Function<Object, String> testCode = paramItemValue -> {
            if (paramItemValue == null) {
                return "";
            } else {
                String itemValueString = BinaryData.fromObject(paramItemValue).toString();
                int strLength = itemValueString.length();
                int startOffset = 0;
                while (startOffset < strLength) {
                    if (itemValueString.charAt(startOffset) != '"') {
                        break;
                    }
                    startOffset++;
                }
                if (startOffset == strLength) {
                    return "";
                }
                int endOffset = strLength - 1;
                while (endOffset >= 0) {
                    if (itemValueString.charAt(endOffset) != '"') {
                        break;
                    }

                    endOffset--;
                }
                return itemValueString.substring(startOffset, endOffset + 1);
            }
        };

        Function<List<Object>, String> serializeCsvCode
            = paramItems -> paramItems.stream().map(testCode).collect(Collectors.joining(","));

        // Long
        Assertions.assertEquals("1,2,3", serializeCsvCode.apply(List.of(1L, 2L, 3L)));

        // String
        Assertions.assertEquals("a,b,c", serializeCsvCode.apply(List.of("a", "b", "c")));

        // Enum
        Assertions.assertEquals("0,100", serializeCsvCode.apply(List.of(PriorityModel.LOW, PriorityModel.HIGH)));

        // date-time
        Assertions.assertEquals("2025-01-24T07:34:05Z,2024-05-20T00:00:01Z", serializeCsvCode.apply(
            List.of(OffsetDateTime.parse("2025-01-24T07:34:05Z"), OffsetDateTime.parse("2024-05-20T00:00:01Z"))));
    }

    /**
     * Defines values for PriorityModel.
     */
    public static final class PriorityModel implements ExpandableEnum<Integer> {
        private static final Map<Integer, PriorityModel> VALUES = new ConcurrentHashMap<>();

        private static final Function<Integer, PriorityModel> NEW_INSTANCE = PriorityModel::new;

        /**
         * Static value 100 for PriorityModel.
         */
        @Generated
        public static final PriorityModel HIGH = fromValue(100);

        /**
         * Static value 0 for PriorityModel.
         */
        @Generated
        public static final PriorityModel LOW = fromValue(0);

        private final Integer value;

        private PriorityModel(Integer value) {
            this.value = value;
        }

        /**
         * Creates or finds a PriorityModel.
         *
         * @param value a value to look for.
         * @return the corresponding PriorityModel.
         * @throws IllegalArgumentException if value is null.
         */
        @Generated
        public static PriorityModel fromValue(Integer value) {
            if (value == null) {
                throw new IllegalArgumentException("'value' cannot be null.");
            }
            return VALUES.computeIfAbsent(value, NEW_INSTANCE);
        }

        /**
         * Gets known PriorityModel values.
         *
         * @return Known PriorityModel values.
         */
        @Generated
        public static Collection<PriorityModel> values() {
            return new ArrayList<>(VALUES.values());
        }

        /**
         * Gets the value of the PriorityModel instance.
         *
         * @return the value of the PriorityModel instance.
         */
        @Generated
        @Override
        public Integer getValue() {
            return this.value;
        }

        @Generated
        @Override
        public String toString() {
            return Objects.toString(this.value);
        }

        @Generated
        @Override
        public boolean equals(Object obj) {
            return this == obj;
        }

        @Generated
        @Override
        public int hashCode() {
            return Objects.hashCode(this.value);
        }
    }
}
