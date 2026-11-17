// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Initializer;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration;

public abstract class RangeUtil {

    static class RangeResult {

        int pos;
        int[] intervalStarts;
        int[] intervalEnds;
        int[] intervalFlags;

        RangeResult() {
            this.pos = 0;
            this.intervalStarts = new int[10];
            this.intervalEnds = new int[10];
            this.intervalFlags = new int[10];
        }

        void addInterval(int start, int end) {
            addInterval(start, end, 0);
        }

        void addInterval(int start, int end, int flags) {
            if (this.pos >= this.intervalStarts.length) {
                System.arraycopy(this.intervalStarts, 0, this.intervalStarts = new int[this.pos * 2], 0, this.pos);
                System.arraycopy(this.intervalEnds, 0, this.intervalEnds = new int[this.pos * 2], 0, this.pos);
                System.arraycopy(this.intervalFlags, 0, this.intervalFlags = new int[this.pos * 2], 0, this.pos);
            }
            this.intervalStarts[this.pos] = start;
            this.intervalEnds[this.pos] = end;
            this.intervalFlags[this.pos] = flags;
            this.pos++;
        }

        int[][] getRanges() {
            int[] resultStarts = new int[this.pos];
            int[] resultEnds = new int[this.pos];
            int[] resultFlags = new int[this.pos];

            System.arraycopy(this.intervalStarts, 0, resultStarts, 0, this.pos);
            System.arraycopy(this.intervalEnds, 0, resultEnds, 0, this.pos);
            System.arraycopy(this.intervalFlags, 0, resultFlags, 0, this.pos);

            if (resultStarts.length > 1) {
                quickSort(resultStarts, resultEnds, resultFlags, 0, resultStarts.length - 1);
            }
            return new int[][] { resultStarts, resultEnds, resultFlags };
        }

        private void quickSort(int[] list, int[] list2, int[] list3, int left, int right) {
            int original_left = left;
            int original_right = right;
            int mid = list[left + (right - left) / 2];
            do {
                while (compare(list[left], mid) < 0) {
                    left++;
                }
                while (compare(mid, list[right]) < 0) {
                    right--;
                }
                if (left <= right) {
                    int tmp = list[left];
                    list[left] = list[right];
                    list[right] = tmp;

                    tmp = list2[left];
                    list2[left] = list2[right];
                    list2[right] = tmp;

                    tmp = list3[left];
                    list3[left] = list3[right];
                    list3[right] = tmp;

                    left++;
                    right--;
                }
            } while (left <= right);

            if (original_left < right) {
                quickSort(list, list2, list3, original_left, right);
            }
            if (left < original_right) {
                quickSort(list, list2, list3, left, original_right);
            }
        }

        private int compare(int i1, int i2) {
            return i1 - i2;
        }
    }

    public static boolean containsErrorInSignature(AbstractMethodDeclaration method) {
        return method.sourceEnd + 1 == method.bodyStart || method.bodyEnd == method.declarationSourceEnd;
    }

    public static int[][] computeDietRange(TypeDeclaration[] types) {
        if (types == null || types.length == 0) {
            return new int[3][0];
        } else {
            RangeResult result = new RangeResult();
            computeDietRange0(types, result);
            return result.getRanges();
        }
    }

    private static void computeDietRange0(TypeDeclaration[] types, RangeResult result) {
        for (TypeDeclaration type : types) {
            // members
            TypeDeclaration[] memberTypeDeclarations = type.memberTypes;
            if (memberTypeDeclarations != null && memberTypeDeclarations.length > 0) {
                computeDietRange0(type.memberTypes, result);
            }
            // methods
            AbstractMethodDeclaration[] methods = type.methods;
            if (methods != null) {
                for (AbstractMethodDeclaration method : methods) {
                    if (containsIgnoredBody(method)) {
                        if (containsErrorInSignature(method)) {
                            method.bits |= 32;
                            result.addInterval(method.declarationSourceStart, method.declarationSourceEnd, 2);
                        } else {
                            int flags = method.sourceEnd + 1 == method.bodyStart ? 1 : 0;
                            result.addInterval(method.bodyStart, method.bodyEnd, flags);
                        }
                    }
                }
            }

            // initializers
            FieldDeclaration[] fields = type.fields;
            if (fields != null) {
                for (FieldDeclaration field : fields) {
                    if (field instanceof Initializer initializer) {
                        if (initializer.declarationSourceEnd == initializer.bodyEnd
                            && initializer.declarationSourceStart != initializer.declarationSourceEnd) {
                            initializer.bits |= 32;
                            result.addInterval(initializer.declarationSourceStart, initializer.declarationSourceEnd, 2);
                        } else {
                            result.addInterval(initializer.bodyStart, initializer.bodyEnd);
                        }
                    }
                }
            }
        }
    }

    public static boolean containsIgnoredBody(AbstractMethodDeclaration method) {
        return !method.isDefaultConstructor() && !method.isClinit() && (method.modifiers & 16777216) == 0;
    }
}
