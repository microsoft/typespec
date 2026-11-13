// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2022 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Modifier node.
 *
 * <pre>
 * Modifier:
 *    <b>public</b>
 *    <b>protected</b>
 *    <b>private</b>
 *    <b>static</b>
 *    <b>abstract</b>
 *    <b>final</b>
 *    <b>native</b>
 *    <b>synchronized</b>
 *    <b>transient</b>
 *    <b>volatile</b>
 *    <b>strictfp</b>
 *    <b>default</b>
 *    <b>sealed</b>
 *    <b>non-sealed</b>
 * </pre>
 *
 * <p> The numeric values of these flags match the ones for class files as described in the Java Virtual Machine
 * Specification (except for <b>default</b>). </p>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public final class Modifier extends ASTNode implements IExtendedModifier {

    /**
     * Modifier keywords (typesafe enumeration).
     *
     * @since 3.0
     */
    public static class ModifierKeyword {

        /** "abstract" modifier with flag value <code>1024</code>. */
        public static final ModifierKeyword ABSTRACT_KEYWORD = new ModifierKeyword("abstract", 1024);//$NON-NLS-1$

        /** "final" modifier with flag value <code>16</code>. */
        public static final ModifierKeyword FINAL_KEYWORD = new ModifierKeyword("final", 16);//$NON-NLS-1$

        /**
         * Map from token to operator (key type: <code>String</code>; value type: <code>Operator</code>).
         */
        private static final Map KEYWORDS;

        /** "native" modifier with flag value <code>256</code>. */
        public static final ModifierKeyword NATIVE_KEYWORD = new ModifierKeyword("native", 256);//$NON-NLS-1$

        /** "private" modifier with flag value <code>2</code>. */
        public static final ModifierKeyword PRIVATE_KEYWORD = new ModifierKeyword("private", 2);//$NON-NLS-1$

        /** "protected" modifier with flag value <code>4</code>. */
        public static final ModifierKeyword PROTECTED_KEYWORD = new ModifierKeyword("protected", 4);//$NON-NLS-1$

        /** "public" modifier with flag value <code>1</code>. */
        public static final ModifierKeyword PUBLIC_KEYWORD = new ModifierKeyword("public", 1);//$NON-NLS-1$

        /** "static" modifier with flag value <code>8</code>. */
        public static final ModifierKeyword STATIC_KEYWORD = new ModifierKeyword("static", 8);//$NON-NLS-1$

        /** "strictfp" modifier with flag value <code>2048</code>. */
        public static final ModifierKeyword STRICTFP_KEYWORD = new ModifierKeyword("strictfp", 2048);//$NON-NLS-1$

        /** "synchronized" modifier with flag value <code>32</code>. */
        public static final ModifierKeyword SYNCHRONIZED_KEYWORD = new ModifierKeyword("synchronized", 32);//$NON-NLS-1$

        /** "transient" modifier with flag value <code>128</code>. */
        public static final ModifierKeyword TRANSIENT_KEYWORD = new ModifierKeyword("transient", 128);//$NON-NLS-1$

        /** "volatile" modifier with flag value <code>64</code>. */
        public static final ModifierKeyword VOLATILE_KEYWORD = new ModifierKeyword("volatile", 64);//$NON-NLS-1$

        /**
         * "default" modifier with flag value <code>65536</code> (added in JLS8 API). <p> Note that the value of
         * this modifier is internal and is not specified in the Java Virtual Machine Specification. </p>
         *
         * @since 3.10
         */
        public static final ModifierKeyword DEFAULT_KEYWORD = new ModifierKeyword("default", 65536);//$NON-NLS-1$

        /**
         * @since 3.24
         */
        public static final ModifierKeyword SEALED_KEYWORD = new ModifierKeyword("sealed", 512);//$NON-NLS-1$

        /**
         * @since 3.24
         */
        public static final ModifierKeyword NON_SEALED_KEYWORD = new ModifierKeyword("non-sealed", 4096);//$NON-NLS-1$

        /**
         * @since 3.40
         * @noreference preview feature
         */
        public static final ModifierKeyword MODULE_KEYWORD = new ModifierKeyword("module", 32768);//$NON-NLS-1$

        static {
            KEYWORDS = new HashMap(20);
            ModifierKeyword[] ops = {
                PUBLIC_KEYWORD,
                PROTECTED_KEYWORD,
                PRIVATE_KEYWORD,
                STATIC_KEYWORD,
                ABSTRACT_KEYWORD,
                FINAL_KEYWORD,
                NATIVE_KEYWORD,
                SYNCHRONIZED_KEYWORD,
                TRANSIENT_KEYWORD,
                VOLATILE_KEYWORD,
                STRICTFP_KEYWORD,
                DEFAULT_KEYWORD,
                SEALED_KEYWORD,
                NON_SEALED_KEYWORD,
                MODULE_KEYWORD };
            for (ModifierKeyword op : ops) {
                KEYWORDS.put(op.toString(), op);
            }
        }

        /**
         * The flag value for the modifier.
         */
        private final int flagValue;

        /**
         * The keyword modifier string.
         */
        private final String keyword;

        /**
         * Creates a new modifier with the given keyword. <p> Note: this constructor is private. The only instances ever
         * created are the ones for the standard modifiers. </p>
         *
         * @param keyword the character sequence for the modifier
         * @param flagValue flag value as described in the Java Virtual Machine Specification
         */
        private ModifierKeyword(String keyword, int flagValue) {
            this.keyword = keyword;
            this.flagValue = flagValue;
        }

        /**
         * Returns the modifier flag value corresponding to this modifier keyword. These flag values are as described in
         * the Java Virtual Machine Specification.
         *
         * @return one of the <code>Modifier</code> constants
         */
        public int toFlagValue() {
            return this.flagValue;
        }

        /**
         * Returns the keyword for the modifier.
         *
         * @return the keyword for the modifier
         */
        @Override
        public String toString() {
            return this.keyword;
        }
    }

    /**
     * The "keyword" structural property of this node type (type: {@link Modifier.ModifierKeyword}).
     *
     * @since 3.0
     */
    public static final SimplePropertyDescriptor KEYWORD_PROPERTY
        = new SimplePropertyDescriptor(Modifier.class, "keyword", Modifier.ModifierKeyword.class); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(2);
        createPropertyList(Modifier.class, properyList);
        addProperty(KEYWORD_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * Returns whether the given flags includes the "abstract" modifier. Applicable to types and methods.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>ABSTRACT</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isAbstract(int flags) {
        return (flags & 1024) != 0;
    }

    /**
     * Returns whether the given flags includes the "final" modifier. Applicable to types, methods, fields, and
     * variables.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>FINAL</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isFinal(int flags) {
        return (flags & 16) != 0;
    }

    /**
     * Returns whether the given flags includes the "native" modifier. Applicable only to methods.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>NATIVE</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isNative(int flags) {
        return (flags & 256) != 0;
    }

    /**
     * Returns whether the given flags includes the "private" modifier. Applicable to types, methods, constructors, and
     * fields.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>PRIVATE</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isPrivate(int flags) {
        return (flags & 2) != 0;
    }

    /**
     * Returns whether the given flags includes the "protected" modifier. Applicable to types, methods, constructors,
     * and fields.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>PROTECTED</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isProtected(int flags) {
        return (flags & 4) != 0;
    }

    /**
     * Returns whether the given flags includes the "public" modifier. Applicable to types, methods, constructors, and
     * fields.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>PUBLIC</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isPublic(int flags) {
        return (flags & 1) != 0;
    }

    /**
     * Returns whether the given flags includes the "static" modifier. Applicable to types, methods, fields, and
     * initializers.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>STATIC</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isStatic(int flags) {
        return (flags & 8) != 0;
    }

    /**
     * Returns whether the given flags includes the "strictfp" modifier. Applicable to types and methods.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>STRICTFP</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isStrictfp(int flags) {
        return (flags & 2048) != 0;
    }

    /**
     * Returns whether the given flags includes the "synchronized" modifier. Applicable only to methods.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>SYNCHRONIZED</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isSynchronized(int flags) {
        return (flags & 32) != 0;
    }

    /**
     * Returns whether the given flags includes the "transient" modifier. Applicable only to fields.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>TRANSIENT</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isTransient(int flags) {
        return (flags & 128) != 0;
    }

    /**
     * Returns whether the given flags includes the "volatile" modifier. Applicable only to fields.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>VOLATILE</code> bit is set, and <code>false</code> otherwise
     * @since 2.0
     */
    public static boolean isVolatile(int flags) {
        return (flags & 64) != 0;
    }

    /**
     * Returns whether the given flags includes the "sealed" modifier. Applicable only to types.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>SEALED</code> bit is set and <code>false</code> otherwise
     * @since 3.24
     */
    public static boolean isSealed(int flags) {
        return (flags & 512) != 0;
    }

    /**
     * Returns whether the given flags includes the "non-sealed" modifier. Applicable only to types.
     *
     * @param flags the modifier flags
     * @return <code>true</code> if the <code>NON_SEALED</code> bit is set and <code>false</code> otherwise
     * @since 3.24
     */
    public static boolean isNonSealed(int flags) {
        return (flags & 4096) != 0;
    }

    /**
     * The modifier keyword; defaults to an unspecified modifier.
     *
     * @since 3.0
     */
    private ModifierKeyword modifierKeyword = ModifierKeyword.PUBLIC_KEYWORD;

    /**
     * Creates a new unparented modifier node owned by the given AST. By default, the node has unspecified (but legal)
     * modifier. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     * @since 3.0
     */
    Modifier(AST ast) {
        super(ast);
        unsupportedIn2();
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);
        visitor.endVisit(this);
    }

    /**
     * Returns the modifier keyword of this modifier node.
     *
     * @return the modifier keyword
     * @since 3.0
     */
    public ModifierKeyword getKeyword() {
        return this.modifierKeyword;
    }

    @Override
    final int getNodeType0() {
        return 83;
    }

    /**
     * @see IExtendedModifier#isAnnotation()
     */
    @Override
    public boolean isAnnotation() {
        return false;
    }

    /**
     * @see IExtendedModifier#isModifier()
     */
    @Override
    public boolean isModifier() {
        return true;
    }

    /**
     * Answer true if the receiver is the static modifier, false otherwise.
     *
     * @return true if the receiver is the static modifier, false otherwise
     * @since 3.2
     */
    public boolean isStatic() {
        return this.modifierKeyword == ModifierKeyword.STATIC_KEYWORD;
    }

    /**
     * Sets the modifier keyword of this modifier node.
     *
     * @param modifierKeyord the modifier keyword
     * @exception IllegalArgumentException if the argument is <code>null</code>
     * @since 3.0
     */
    public void setKeyword(ModifierKeyword modifierKeyord) {
        if (modifierKeyord == null) {
            throw new IllegalArgumentException();
        }
        preValueChange();
        this.modifierKeyword = modifierKeyord;

    }
}
