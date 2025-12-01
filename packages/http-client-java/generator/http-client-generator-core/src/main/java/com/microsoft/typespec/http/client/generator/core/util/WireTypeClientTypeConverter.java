// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import io.clientcore.core.utils.Base64Uri;
import io.clientcore.core.utils.DateTimeRfc1123;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

/**
 * Class to group conversion logic between client type and wire type.
 */
public class WireTypeClientTypeConverter {

    private WireTypeClientTypeConverter() {
    }

    /**
     * Convert wire type expression to client type expression.
     * Any change to this method should also be reflected in {@link #convertLiteralToClientValue(IType, String)}, and
     * {@link #convertToWireTypeExpression(ClassType, String)} if necessary.
     *
     * @param wireType the wire type
     * @param expression value expression
     * @return value expression in client type form
     * @see #convertLiteralToClientValue(IType, String) {@link #convertToWireTypeExpression(ClassType, String)}
     */
    public static String convertToClientTypeExpression(ClassType wireType, String expression) {

        if (wireType == ClassType.DATE_TIME_RFC_1123) {
            expression = expression + ".getDateTime()";
        } else if (wireType == ClassType.UNIX_TIME_LONG) {
            expression = "OffsetDateTime.ofInstant(Instant.ofEpochSecond(" + expression + "), ZoneOffset.UTC)";
        } else if (wireType == ClassType.BASE_64_URL) {
            expression = expression + ".decodedBytes()";
        } else if (wireType == ClassType.URL) {
            expression = "new URL(" + expression + ")";
        } else if (wireType == ClassType.DURATION_LONG) {
            expression = "Duration.ofSeconds(" + expression + ")";
        } else if (wireType == ClassType.DURATION_DOUBLE) {
            expression = "Duration.ofNanos((long) (" + expression + " * 1000_000_000L))";
        }

        return expression;
    }

    /**
     * Convert client type expression to wire type expression.
     * Any change to this method should also be reflected in {@link #convertLiteralToClientValue(IType, String)}, and
     * {@link #convertToClientTypeExpression(ClassType, String)} if necessary.
     *
     * @param clientType the client type
     * @param expression value expression
     * @return value expression in wire type form
     * @see #convertLiteralToClientValue(IType, String) {@link #convertToClientTypeExpression(ClassType, String)}
     */
    public static String convertToWireTypeExpression(ClassType clientType, String expression) {

        if (clientType == ClassType.DATE_TIME_RFC_1123) {
            expression = "new DateTimeRfc1123(" + expression + ")";
        } else if (clientType == ClassType.UNIX_TIME_LONG) {
            expression = expression + ".toEpochSecond()";
        } else if (clientType == ClassType.BASE_64_URL) {
            expression = ClassType.BASE_64_URL.getName() + ".encode(" + expression + ")";
        } else if (clientType == ClassType.URL) {
            expression = expression + ".toString()";
        } else if (clientType == ClassType.DURATION_LONG) {
            expression = expression + ".getSeconds()";
        } else if (clientType == ClassType.DURATION_DOUBLE) {
            expression = "(double) " + expression + ".toNanos() / 1000_000_000L";
        }

        return expression;
    }

    /**
     * Convert example literal value in wire type, to literal value in client type.
     * <p>
     * date-time in RFC1123 to RFC3339
     * date-time in Unix epoch to RFC3339
     * bytes in base64URL to bytes in string
     *
     * @param wireType the wire type
     * @param literalInWireType the literal value in wire type
     * @return the literal value in client type
     * @see #convertToWireTypeExpression(ClassType, String) {@link #convertToClientTypeExpression(ClassType, String)}
     */
    public static String convertLiteralToClientValue(IType wireType, String literalInWireType) {
        String literalValue = literalInWireType;
        if (wireType == ClassType.DATE_TIME_RFC_1123) {
            literalValue = new DateTimeRfc1123(literalValue).getDateTime().toString();
        } else if (wireType == ClassType.BASE_64_URL) {
            literalValue = new Base64Uri(literalValue).toString();
        } else if (wireType.asNullable() == ClassType.UNIX_TIME_LONG) {
            literalValue = Instant.ofEpochSecond(Long.parseLong(literalValue)).atOffset(ZoneOffset.UTC).toString();
        } else if (wireType.asNullable() == ClassType.DURATION_LONG) {
            literalValue = Duration.ofSeconds(Long.parseLong(literalValue)).toString();
        } else if (wireType.asNullable() == ClassType.DURATION_DOUBLE) {
            literalValue = Duration.ofNanos((long) (Double.parseDouble(literalInWireType) * 1000_000_000L)).toString();
        }
        return literalValue;
    }
}
