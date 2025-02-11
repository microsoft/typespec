package com.microsoft.provisioning.http.client.generator.provisioning.utils;

import java.util.function.Function;
import java.util.function.Predicate;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public final class NameUtils {
    private static final Pattern CASE_SPLIT = Pattern.compile("[_\\- ]");
    private static final String[] BASIC_LATIN_CHARACTERS;
    private static final Pattern MERGE_UNDERSCORES = Pattern.compile("_{2,}");
    private static final Pattern CHARACTERS_TO_REPLACE_WITH_UNDERSCORE = Pattern.compile("[\\\\/.+ -]+");
    private static final Pattern VERSION_TO_ENUM = Pattern.compile("[-.]");

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

    public static String getVersionIdentifier(String version) {
        String versionInEnum = VERSION_TO_ENUM.matcher(version).replaceAll("_").toUpperCase();
        if (!versionInEnum.startsWith("V")) {
            versionInEnum = "V" + versionInEnum;
        }
        return versionInEnum;
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

    private static String formatCase(String name, boolean toLower) {
        if (name == null || name.isEmpty()) {
            return name;
        }

        int length = name.length();
        char c0 = name.charAt(0);
        if ((length < 2) || ((length == 2) && Character.isUpperCase(c0) && Character.isUpperCase(name.charAt(1)))) {
            return toLower ? name.toLowerCase() : name.toUpperCase();
        } else {
            return (toLower ? Character.toLowerCase(c0) : Character.toUpperCase(c0)) + name.substring(1);
        }
    }

    public static String getEnumMemberName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }

        // trim leading and trailing '_'
        if ((name.startsWith("_") || name.endsWith("_")) && !name.chars().allMatch(c -> c == '_')) {
            StringBuilder sb = new StringBuilder(name);
            while (sb.length() > 0 && sb.charAt(0) == '_') {
                sb.deleteCharAt(0);
            }
            while (sb.length() > 0 && sb.charAt(sb.length() - 1) == '_') {
                sb.setLength(sb.length() - 1);
            }
            name = sb.toString();
        }

        String result = removeInvalidCharacters(CHARACTERS_TO_REPLACE_WITH_UNDERSCORE.matcher(name).replaceAll("_"));
        result = MERGE_UNDERSCORES.matcher(result).replaceAll("_");  // merge multiple underlines
        Function<Character, Boolean> isUpper = c -> c >= 'A' && c <= 'Z';
        Function<Character, Boolean> isLower = c -> c >= 'a' && c <= 'z';
        for (int i = 1; i < result.length() - 1; i++) {
            if (isUpper.apply(result.charAt(i))) {
                if (result.charAt(i - 1) != '_' && isLower.apply(result.charAt(i - 1))) {
                    result = result.substring(0, i) + "_" + result.substring(i);
                }
            }
        }

        if (result.startsWith("_") || result.endsWith("_")) {
            if (!result.chars().allMatch(c -> c == (int) '_')) {
                // some char is not '_', trim it

                StringBuilder sb = new StringBuilder(result);
                while (sb.length() > 0 && sb.charAt(0) == '_') {
                    sb.deleteCharAt(0);
                }
                while (sb.length() > 0 && sb.charAt(sb.length() - 1) == '_') {
                    sb.setLength(sb.length() - 1);
                }
                result = sb.toString();
            } else {
                // all char is '_', then transform some '_' to
                String basicLatinCharacterReplacement = getBasicLatinCharacter(name.charAt(0));
                if (result.startsWith("_") && basicLatinCharacterReplacement != null) {
                    result = basicLatinCharacterReplacement + result.substring(1);

                    basicLatinCharacterReplacement = getBasicLatinCharacter(name.charAt(name.length() - 1));
                    if (result.endsWith("_") && basicLatinCharacterReplacement != null) {
                        result = result.substring(0, result.length() - 1) + basicLatinCharacterReplacement;
                    }
                }
            }
        }

        return result.toUpperCase();
    }

    public static String getBasicLatinCharacter(char c) {
        if (c >= 128) {
            return null;
        }

        return BASIC_LATIN_CHARACTERS[c];
    }

    public static String removeInvalidCharacters(String name) {
        return getValidName(name, c -> c == '_' || c == '-');
    }

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

    private NameUtils() {

    }

}
