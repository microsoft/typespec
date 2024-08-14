// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.preprocessor.namer;

import org.atteo.evo.inflector.English;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.function.Predicate;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class CodeNamer {
    private static final String[] BASIC_LATIN_CHARACTERS;

    private static final Set<String> RESERVED_WORDS;
    private static final Set<String> RESERVED_WORDS_CLASSES;

    private static final Pattern CASE_SPLIT = Pattern.compile("[_\\- ]");

    static {
        BASIC_LATIN_CHARACTERS = new String[128];
        BASIC_LATIN_CHARACTERS[32] = "Space";
        BASIC_LATIN_CHARACTERS[33] = "ExclamationMark";
        BASIC_LATIN_CHARACTERS[34] = "QuotationMark";
        BASIC_LATIN_CHARACTERS[35] = "NumberSign";
        BASIC_LATIN_CHARACTERS[36] = "DollarSign";
        BASIC_LATIN_CHARACTERS[37] = "PercentSign";
        BASIC_LATIN_CHARACTERS[38] = "Ampersand";
        BASIC_LATIN_CHARACTERS[39] = "Apostrophe";
        BASIC_LATIN_CHARACTERS[40] = "LeftParenthesis";
        BASIC_LATIN_CHARACTERS[41] = "RightParenthesis";
        BASIC_LATIN_CHARACTERS[42] = "Asterisk";
        BASIC_LATIN_CHARACTERS[43] = "PlusSign";
        BASIC_LATIN_CHARACTERS[44] = "Comma";
        BASIC_LATIN_CHARACTERS[45] = "HyphenMinus";
        BASIC_LATIN_CHARACTERS[46] = "FullStop";
        BASIC_LATIN_CHARACTERS[47] = "Slash";
        BASIC_LATIN_CHARACTERS[48] = "Zero";
        BASIC_LATIN_CHARACTERS[49] = "One";
        BASIC_LATIN_CHARACTERS[50] = "Two";
        BASIC_LATIN_CHARACTERS[51] = "Three";
        BASIC_LATIN_CHARACTERS[52] = "Four";
        BASIC_LATIN_CHARACTERS[53] = "Five";
        BASIC_LATIN_CHARACTERS[54] = "Six";
        BASIC_LATIN_CHARACTERS[55] = "Seven";
        BASIC_LATIN_CHARACTERS[56] = "Eight";
        BASIC_LATIN_CHARACTERS[57] = "Nine";
        BASIC_LATIN_CHARACTERS[58] = "Colon";
        BASIC_LATIN_CHARACTERS[59] = "Semicolon";
        BASIC_LATIN_CHARACTERS[60] = "LessThanSign";
        BASIC_LATIN_CHARACTERS[61] = "EqualSign";
        BASIC_LATIN_CHARACTERS[62] = "GreaterThanSign";
        BASIC_LATIN_CHARACTERS[63] = "QuestionMark";
        BASIC_LATIN_CHARACTERS[64] = "AtSign";
        BASIC_LATIN_CHARACTERS[91] = "LeftSquareBracket";
        BASIC_LATIN_CHARACTERS[92] = "Backslash";
        BASIC_LATIN_CHARACTERS[93] = "RightSquareBracket";
        BASIC_LATIN_CHARACTERS[94] = "CircumflexAccent";
        BASIC_LATIN_CHARACTERS[96] = "GraveAccent";
        BASIC_LATIN_CHARACTERS[123] = "LeftCurlyBracket";
        BASIC_LATIN_CHARACTERS[124] = "VerticalBar";
        BASIC_LATIN_CHARACTERS[125] = "RightCurlyBracket";
        BASIC_LATIN_CHARACTERS[126] = "Tilde";

        RESERVED_WORDS = Set.of("abstract", "assert", "boolean", "Boolean", "break",
            "byte", "Byte", "case", "catch", "char", "Character", "class", "Class", "const", "continue", "default",
            "do", "double", "Double", "else", "enum", "extends", "false", "final", "finally", "float", "Float", "for",
            "goto", "if", "implements", "import", "int", "Integer", "long", "Long", "interface", "instanceof", "native",
            "new", "null", "package", "private", "protected", "public", "return", "short", "Short", "static",
            "strictfp", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "true", "try",
            "void", "Void", "volatile", "while", "Date", "Datetime", "OffsetDateTime", "Duration", "Period", "Stream",
            "String", "Object", "header", "_");

        // following are commonly used classes/annotations in service client, from azure-core
        RESERVED_WORDS_CLASSES = new HashSet<>(RESERVED_WORDS);
        RESERVED_WORDS_CLASSES.addAll(Arrays.asList("Host", "ServiceInterface", "ServiceMethod", "ServiceClient",
            "ReturnType", "Get", "Put", "Post", "Patch", "Delete", "Headers", "ExpectedResponses",
            "UnexpectedResponseExceptionType", "UnexpectedResponseExceptionTypes", "HostParam", "PathParam",
            "QueryParam", "HeaderParam", "FormParam", "BodyParam", "Fluent", "Immutable", "JsonFlatten", "Override"));
    }

    private CodeNamer() {
    }

    public static String getBasicLatinCharacter(char c) {
        if (c >= 128) {
            return null;
        }

        return BASIC_LATIN_CHARACTERS[c];
    }

    public static String toCamelCase(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }

        // Remove leading underscores.
        if (name.charAt(0) == '_') {
            return toCamelCase(name.substring(1));
        }

        String[] splits = CASE_SPLIT.split(name);
        if (splits.length == 0) {
            return "";
        }

        splits[0] = formatCase(splits[0], true);
        for (int i = 1; i != splits.length; i++) {
            splits[i] = formatCase(splits[i], false);
        }
        return String.join("", splits);
    }

    public static String toPascalCase(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }

        // Preserve leading underscores and treat them like
        // uppercase characters by calling 'CamelCase()' on the rest.
        if (name.charAt(0) == '_') {
            return '_' + toCamelCase(name.substring(1));
        }

        return CASE_SPLIT.splitAsStream(name)
                .filter(s -> s != null && !s.isEmpty())
                .map(s -> formatCase(s, false))
                .collect(Collectors.joining());
    }

    public static String escapeXmlComment(String comment) {
        if (comment == null || comment.isEmpty()) {
            return comment;
        }

        // Use a linear replacement for the all the characters.
        // This has a few benefits:
        // 1. It performs a single loop over the comment string.
        // 2. It avoids instantiating multiple strings if multiple of the replacement cases are found.
        // 3. If no replacements are needed, it returns the original string.
        StringBuilder sb = null;
        int prevStart = 0;
        int commentLength = comment.length();

        for (int i = 0; i < commentLength; i++) {
            String replacement = null;
            char c = comment.charAt(i);
            if (c == '&') {
                replacement = "&amp;";
            } else if (c == '<') {
                replacement = "&lt;";
            } else if (c == '>') {
                replacement = "&gt;";
            }

            if (replacement != null) {
                if (sb == null) {
                    // Add enough overhead to account for 1/8 of the string to be replaced.
                    sb = new StringBuilder(commentLength + 3 * (commentLength / 8));
                }

                if (prevStart != i) {
                    sb.append(comment, prevStart, i);
                }
                sb.append(replacement);
                prevStart = i + 1;
            }
        }

        if (sb == null) {
            return comment;
        }

        sb.append(comment, prevStart, commentLength);
        return sb.toString();
    }

    private static String formatCase(String name, boolean toLower) {
        if (name == null || name.isEmpty()) {
            return name;
        }

        int length = name.length();
        char c0 = name.charAt(0);
        if ((length < 2)
            || ((length == 2) && Character.isUpperCase(c0) && Character.isUpperCase(name.charAt(1)))) {
            return toLower ? name.toLowerCase() : name.toUpperCase();
        } else {
            return  (toLower ? Character.toLowerCase(c0) : Character.toUpperCase(c0)) + name.substring(1);
        }
    }

    public static String removeInvalidCharacters(String name) {
        return getValidName(name, c -> c == '_' || c == '-');
    }

    /**
     * Gets a valid name for the given name.
     *
     * @param name The name to get a valid name for.
     * @return The valid name.
     */
    public static String getValidName(String name) {
        return getValidName(name, c -> false);
    }

    /**
     * Gets a valid name for the given name.
     *
     * @param name The name to get a valid name for.
     * @param allowedCharacterMatcher A predicate that determines if a character is allowed.
     * @return The valid name.
     */
    public static String getValidName(String name, Predicate<Character> allowedCharacterMatcher) {
        String correctName = removeInvalidCharacters(name, allowedCharacterMatcher);

        // here we have only letters and digits or an empty String
        if (correctName == null || correctName.isEmpty() || getBasicLatinCharacter(correctName.charAt(0)) != null) {
            StringBuilder sb = new StringBuilder();
            for (char symbol : name.toCharArray()) {
                String basicLatinCharacterReplacement = getBasicLatinCharacter(symbol);
                if (basicLatinCharacterReplacement != null) {
                    sb.append(basicLatinCharacterReplacement);
                } else {
                    sb.append(symbol);
                }
            }
            correctName = removeInvalidCharacters(sb.toString(), allowedCharacterMatcher);
        }

        // if it is still empty String, throw
        if (correctName == null || correctName.isEmpty()) {
            throw new IllegalArgumentException(
                "Property name " + name + " cannot be used as an Identifier, as it contains only invalid characters.");
        }

        return correctName;
    }

    public static String getClientName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }
        return getEscapedReservedNameAndClasses(toPascalCase(removeInvalidCharacters(name)), "Client");
    }

    public static String getTypeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }
        return getEscapedReservedNameAndClasses(toPascalCase(removeInvalidCharacters(name)), "Model");
    }

    public static String getParameterName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }
        return getEscapedReservedName(toCamelCase(removeInvalidCharacters(name)), "Parameter");
    }

    public static String getPropertyName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }
        return getEscapedReservedName(toCamelCase(removeInvalidCharacters(name)), "Property");
    }

    public static String getMethodGroupName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }
        name = toPascalCase(name);
        return getEscapedReservedName(name, "Operation");
    }

    public static String getPlural(String name) {
        if (name != null && !name.isEmpty() && !name.endsWith("s") && !name.endsWith("S")) {
            name = English.plural(name);
        }
        return name;
    }

    public static String getMethodName(String name) {
        name = toCamelCase(name);
        return getEscapedReservedName(name, "Method");
    }

    public static String getEscapedReservedName(String name, String appendValue) {
        Objects.requireNonNull(name);
        Objects.requireNonNull(appendValue);

        if (RESERVED_WORDS.contains(name)) {
            name += appendValue;
        }

        return name;
    }

    protected static String getEscapedReservedNameAndClasses(String name, String appendValue) {
        Objects.requireNonNull(name);
        Objects.requireNonNull(appendValue);

        if (RESERVED_WORDS_CLASSES.contains(name)) {
            name += appendValue;
        }

        return name;
    }

    private static String removeInvalidCharacters(String name, Predicate<Character> allowedCharacterMatcher) {
        if (name == null || name.isEmpty()) {
            return name;
        }

        StringBuilder sb = null;
        int prevStart = 0;
        int nameLength = name.length();

        for (int i = 0; i < nameLength; i++) {
            char c = name.charAt(i);
            if (!Character.isLetterOrDigit(c) && !allowedCharacterMatcher.test(c)) {
                if (sb == null) {
                    sb = new StringBuilder(nameLength);
                }

                if (prevStart != i) {
                    sb.append(name, prevStart, i);
                }

                sb.append('_');
                prevStart = i + 1;
            }
        }

        if (sb == null) {
            return name;
        }

        sb.append(name, prevStart, nameLength);
        return sb.toString();
    }
}
