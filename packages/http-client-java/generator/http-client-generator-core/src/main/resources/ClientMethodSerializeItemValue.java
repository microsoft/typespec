paramItemValue -> {
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
}