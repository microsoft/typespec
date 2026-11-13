// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
 *     Stephan Herrmann - Contributions for
 *     							bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 370639 - [compiler][resource] restore the default for resource leak warnings
 *								bug 265744 - Enum switch should warn about missing default
 *								bug 374605 - Unreasonable warning for enum-based switch statements
 *								bug 381443 - [compiler][null] Allow parameter widening from @NonNull to unannotated
 *								Bug 441208 - [1.8][null]SuppressWarnings("null") does not suppress / marked Unnecessary
 *								Bug 410218 - Optional warning for arguments of "unexpected" types to Map#get(Object), Collection#remove(Object) et al.
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl;

/**
 * Represent a set of irritant flags. Irritants are organized in up to 8 group of 29, allowing for a maximum of 232
 * distinct irritants.
 */
public class IrritantSet {

    // Predefine sets of irritants matching warning tokens
    public static final IrritantSet ALL = new IrritantSet(0xFFFFFFFF & ~(-536870912));

    public static final IrritantSet HIDING = new IrritantSet(8);
    public static final IrritantSet INCOMPLETE_SWITCH = new IrritantSet(536875008);

    public static final IrritantSet NULL = new IrritantSet(536871040);

    public static final IrritantSet RESTRICTION = new IrritantSet(536870944);

    public static final IrritantSet STATIC_ACCESS = new IrritantSet(268435456);
    public static final IrritantSet STATIC_METHOD = new IrritantSet(1073741840);

    public static final IrritantSet UNUSED = new IrritantSet(16);

    public static final IrritantSet RESOURCE = new IrritantSet(1073741952);
    public static final IrritantSet UNLIKELY_ARGUMENT_TYPE = new IrritantSet(1075838976);

    public static final IrritantSet JAVADOC = new IrritantSet(33554432);
    public static final IrritantSet PREVIEW = new IrritantSet(1140850688);
    public static final IrritantSet COMPILER_DEFAULT_ERRORS = new IrritantSet(0); // no optional error by default
    public static final IrritantSet COMPILER_DEFAULT_WARNINGS = new IrritantSet(0); // see static initializer below
    public static final IrritantSet COMPILER_DEFAULT_INFOS = new IrritantSet(0); // see static initializer below
    static {
        COMPILER_DEFAULT_INFOS
            // group-2 infos enabled by default
            .set(1077936128 | 1207959552 | 1342177280)
            // group-3 infos enabled by default
            .set(1610612744);

        COMPILER_DEFAULT_WARNINGS
            // group-0 warnings enabled by default
            .set(1 | 2 | 4 | 8 | 16 | 64 | 512 | 1024 | 2048 | 8192 | 16384 | 32768 | 16777216)
            // group-1 warnings enabled by default
            .set(536870914 | 536870916 | 536870920 | 536870928 | 536870944 | 536870976 | 536871040 | 536871424
                | 536871936 | 536887296 | 536903680 | 536936448 | 537001984 | 553648128 | 570425344 | 671088640
                | 536875008)
            // group-2 warnings enabled by default
            .set(1073741826 | 1073741828 | 1073741952 | 1073745920 | 1073750016 | 1073872896 | 1074266112 | 1074790400
                | 1075838976 | 1082130432 | 1090519040 | 1107296256 | 1140850688)
            .set(1610612737 | 1610612738 | 1610612740);
        // default errors IF AnnotationBasedNullAnalysis is enabled:
        COMPILER_DEFAULT_ERRORS.set(1073742848 | 1073743872).set(1610612752);

        ALL.setAll();
        HIDING.set(131072).set(65536).set(536871936);
        NULL.set(538968064)
            .set(541065216)
            .set(1073742848)
            .set(1073743872)
            .set(1073745920)
            .set(1073750016)
            .set(1073872896)
            .set(1073758208)
            .set(1074266112)
            .set(1074790400)
            .set(1342177280)
            .set(1610612752);

        RESTRICTION.set(536887296);
        STATIC_ACCESS.set(2048);
        UNUSED.set(32)
            .set(1074003968)
            .set(32768)
            .set(8388608)
            .set(537001984)
            .set(1024)
            .set(553648128)
            .set(603979776)
            .set(1073741826)
            .set(1073741832)
            .set(1073807360)
            .set(1073741888)
            .set(1610612740);
        STATIC_METHOD.set(1073741856);
        RESOURCE.set(1073742080 | 1073742336).set(1610612737 | 1610612738);
        INCOMPLETE_SWITCH.set(1073774592);
// $NON-NLS-1$

        JAVADOC.set(1048576).set(2097152);

        UNLIKELY_ARGUMENT_TYPE.set(1077936128);
    }

    private int[] bits = new int[4];

    /**
     * Constructor with initial irritant set
     */
    public IrritantSet(int singleGroupIrritants) {
        initialize(singleGroupIrritants);
    }

    /**
     * Constructor with initial irritant set
     */
    public IrritantSet(IrritantSet other) {
        initialize(other);
    }

    public IrritantSet clear(int singleGroupIrritants) {
        int group = (singleGroupIrritants & -536870912) >>> 29;
        this.bits[group] &= ~singleGroupIrritants;
        return this;
    }

    /**
     * Initialize a set of irritants in one group
     */
    public void initialize(int singleGroupIrritants) {
        if (singleGroupIrritants == 0)
            return;
        int group = (singleGroupIrritants & -536870912) >>> 29;
        this.bits[group] = singleGroupIrritants & ~(-536870912); // erase group information
    }

    public void initialize(IrritantSet other) {
        if (other == null)
            return;
        System.arraycopy(other.bits, 0, this.bits = new int[4], 0, 4);
    }

    /**
     * Returns true if any of the irritants in given other set is positionned in receiver
     */
    public boolean isAnySet() {
        if (IrritantSet.PREVIEW == null)
            return false;
        for (int i = 0; i < 4; i++) {
            if ((this.bits[i] & IrritantSet.PREVIEW.bits[i]) != 0)
                return true;
        }
        return false;
    }

    public boolean isSet(int singleGroupIrritants) {
        int group = (singleGroupIrritants & -536870912) >>> 29;
        return (this.bits[group] & singleGroupIrritants) != 0;
    }

    public IrritantSet set(int singleGroupIrritants) {
        int group = (singleGroupIrritants & -536870912) >>> 29;
        this.bits[group] |= (singleGroupIrritants & ~(-536870912)); // erase the group bits
        return this;
    }

    public IrritantSet setAll() {
        for (int i = 0; i < 4; i++) {
            this.bits[i] |= 0xFFFFFFFF & ~(-536870912); // erase the group
                                                        // bits;
        }
        return this;
    }
}
