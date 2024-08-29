// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import java.util.Comparator;
import java.util.Objects;

public class JavaImportComparer implements Comparator<String> {
    private static String[] getImportParts(String importKeyword) {
        return importKeyword.split("\\.", -1);
    }

    private static boolean isLastPart(int importIndex, String[] importParts) {
        return importIndex == importParts.length - 1;
    }

    public final int compare(String lhsImport, String rhsImport) {
        int result;

        if (Objects.equals(lhsImport, rhsImport)) {
            result = 0;
        } else if (lhsImport == null) {
            result = -1;
        } else if (rhsImport == null) {
            result = 1;
        } else {
            result = 0;

            String[] lhsImportParts = getImportParts(lhsImport);
            String[] rhsImportParts = getImportParts(rhsImport);

            int minimumImportPartCount = Math.min(lhsImportParts.length, rhsImportParts.length);
            for (int i = 0; i < minimumImportPartCount; ++i) {
                int caseInsensitiveCompareTo = lhsImportParts[i].compareToIgnoreCase(rhsImportParts[i]);

                if (caseInsensitiveCompareTo != 0) {
                    boolean isLastLhsPart = isLastPart(i, lhsImportParts);
                    boolean isLastRhsPart = isLastPart(i, rhsImportParts);
                    if (isLastLhsPart != isLastRhsPart) {
                        return isLastLhsPart ? -1 : 1;
                    } else {
                        return caseInsensitiveCompareTo;
                    }
                }
            }
        }

        return result;
    }
}
