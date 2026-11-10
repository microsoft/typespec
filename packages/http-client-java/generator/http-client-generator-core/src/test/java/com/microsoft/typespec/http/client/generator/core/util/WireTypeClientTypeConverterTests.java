// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

public class WireTypeClientTypeConverterTests {
    @ParameterizedTest
    @MethodSource("classTypeExpressions")
    public void convertsClassTypeExpressionsInBothDirections(ClassType type, String clientExpression,
        String wireExpression) {
        assertEquals(clientExpression, WireTypeClientTypeConverter.convertToClientTypeExpression(type, "value"));
        assertEquals(wireExpression, WireTypeClientTypeConverter.convertToWireTypeExpression(type, "value"));
    }

    private static Stream<Arguments> classTypeExpressions() {
        return Stream.of(
            Arguments.of(ClassType.DATE_TIME_RFC_1123, "value.getDateTime()", "new DateTimeRfc1123(value)"),
            Arguments.of(ClassType.UNIX_TIME_LONG,
                "OffsetDateTime.ofInstant(Instant.ofEpochSecond(value), ZoneOffset.UTC)", "value.toEpochSecond()"),
            Arguments.of(ClassType.BASE_64_URL, "value.decodedBytes()", "Base64Url.encode(value)"),
            Arguments.of(ClassType.URL, "new URL(value)", "value.toString()"),
            Arguments.of(ClassType.DURATION_LONG, "Duration.ofSeconds(value)", "value.getSeconds()"),
            Arguments.of(ClassType.DURATION_DOUBLE, "Duration.ofNanos((long) (value * 1000_000_000L))",
                "(double) value.toNanos() / 1000_000_000L"),
            Arguments.of(ClassType.DURATION_MILLISECONDS_LONG, "Duration.ofMillis(value)", "value.toMillis()"),
            Arguments.of(ClassType.DURATION_MILLISECONDS_DOUBLE, "Duration.ofNanos((long) (value * 1000_000L))",
                "(double) value.toNanos() / 1000_000L"),
            Arguments.of(ClassType.STRING, "value", "value"));
    }

    @ParameterizedTest
    @MethodSource("primitiveTypeExpressions")
    public void convertsPrimitiveTypeExpressionsInBothDirections(PrimitiveType type, String clientExpression,
        String wireExpression) {
        assertEquals(clientExpression, WireTypeClientTypeConverter.convertToClientTypeExpression(type, "value"));
        assertEquals(wireExpression, WireTypeClientTypeConverter.convertToWireTypeExpression(type, "value"));
    }

    private static Stream<Arguments> primitiveTypeExpressions() {
        return Stream.of(
            Arguments.of(PrimitiveType.UNIX_TIME_LONG,
                "OffsetDateTime.ofInstant(Instant.ofEpochSecond(value), ZoneOffset.UTC)", "value.toEpochSecond()"),
            Arguments.of(PrimitiveType.DURATION_LONG, "Duration.ofSeconds(value)", "value.getSeconds()"),
            Arguments.of(PrimitiveType.DURATION_DOUBLE, "Duration.ofNanos((long) (value * 1000_000_000L))",
                "(double) value.toNanos() / 1000_000_000L"),
            Arguments.of(PrimitiveType.DURATION_MILLISECONDS_LONG, "Duration.ofMillis(value)", "value.toMillis()"),
            Arguments.of(PrimitiveType.DURATION_MILLISECONDS_DOUBLE, "Duration.ofNanos((long) (value * 1000_000L))",
                "(double) value.toNanos() / 1000_000L"),
            Arguments.of(PrimitiveType.INT, "value", "value"), Arguments.of(PrimitiveType.LONG, "value", "value"),
            Arguments.of(PrimitiveType.DOUBLE, "value", "value"));
    }

    @ParameterizedTest
    @MethodSource("literalConversions")
    public void convertsWireLiteralsToClientValues(IType type, String wireLiteral, String expected) {
        assertEquals(expected, WireTypeClientTypeConverter.convertLiteralToClientValue(type, wireLiteral));
    }

    private static Stream<Arguments> literalConversions() {
        return Stream.of(
            Arguments.of(ClassType.DATE_TIME_RFC_1123, "Wed, 21 Oct 2015 07:28:00 GMT", "2015-10-21T07:28Z"),
            Arguments.of(ClassType.BASE_64_URL, "-_8=", "-_8="),
            Arguments.of(ClassType.UNIX_TIME_LONG, "0", "1970-01-01T00:00Z"),
            Arguments.of(PrimitiveType.UNIX_TIME_LONG, "-1", "1969-12-31T23:59:59Z"),
            Arguments.of(ClassType.DURATION_LONG, "90", "PT1M30S"),
            Arguments.of(PrimitiveType.DURATION_LONG, "0", "PT0S"),
            Arguments.of(ClassType.DURATION_DOUBLE, "1.25", "PT1.25S"),
            Arguments.of(PrimitiveType.DURATION_DOUBLE, "-1.5", "PT-1.5S"),
            Arguments.of(PrimitiveType.DURATION_DOUBLE, "0.0000000009", "PT0S"),
            Arguments.of(ClassType.DURATION_MILLISECONDS_LONG, "1500", "PT1.5S"),
            Arguments.of(PrimitiveType.DURATION_MILLISECONDS_LONG, "1", "PT0.001S"),
            Arguments.of(ClassType.DURATION_MILLISECONDS_DOUBLE, "1500.5", "PT1.5005S"),
            Arguments.of(PrimitiveType.DURATION_MILLISECONDS_DOUBLE, "0.000001", "PT0.000000001S"),
            Arguments.of(ClassType.STRING, "unchanged", "unchanged"), Arguments.of(PrimitiveType.LONG, "123", "123"));
    }

    @ParameterizedTest
    @MethodSource("convertedLiteralTypes")
    public void preservesInvalidLiteralsInsteadOfFailingConversion(IType type) {
        assertEquals("not a literal", WireTypeClientTypeConverter.convertLiteralToClientValue(type, "not a literal"));
    }

    private static Stream<IType> convertedLiteralTypes() {
        return Stream.of(ClassType.DATE_TIME_RFC_1123, ClassType.UNIX_TIME_LONG, PrimitiveType.UNIX_TIME_LONG,
            ClassType.DURATION_LONG, PrimitiveType.DURATION_LONG, ClassType.DURATION_DOUBLE,
            PrimitiveType.DURATION_DOUBLE, ClassType.DURATION_MILLISECONDS_LONG,
            PrimitiveType.DURATION_MILLISECONDS_LONG, ClassType.DURATION_MILLISECONDS_DOUBLE,
            PrimitiveType.DURATION_MILLISECONDS_DOUBLE);
    }

    @Test
    public void preservesUnixTimeOutsideTheSupportedInstantRange() {
        String literal = Long.toString(Long.MAX_VALUE);

        assertEquals(literal,
            WireTypeClientTypeConverter.convertLiteralToClientValue(PrimitiveType.UNIX_TIME_LONG, literal));
    }
}
