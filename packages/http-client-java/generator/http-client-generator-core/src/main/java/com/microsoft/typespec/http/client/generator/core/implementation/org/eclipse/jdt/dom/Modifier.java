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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

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
@SuppressWarnings({ "rawtypes" })
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

    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);

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
    int getNodeType0() {
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
