// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Module Modifier node - represents the modifiers for the requires directive in module declaration (added in JLS9 API).
 *
 * <pre>
 * ModuleModifier:
 *    <b>static</b>
 *    <b>transitive</b>
 * </pre>
 *
 * <p> The numeric values of these flags match the ones for class files as described in the Java Virtual Machine
 * Specification. Note that the value of <b>static</b> does <b>not</b> correspond to the value of
 * the <b>static</b> {@link Modifier} (<code>8</code>)! </p>
 *
 * @since 3.14
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public final class ModuleModifier extends ASTNode {

    /**
     * Module Modifier keywords (typesafe enumeration).
     */
    public static class ModuleModifierKeyword {

        /** "static" modifier with flag value <code>64</code>. */
        public static final ModuleModifierKeyword STATIC_KEYWORD = new ModuleModifierKeyword("static");//$NON-NLS-1$

        /** "transitive" modifier with flag value <code>128</code>. */
        public static final ModuleModifierKeyword TRANSITIVE_KEYWORD = new ModuleModifierKeyword("transitive");//$NON-NLS-1$

        /**
         * Map from token to operator (key type: <code>String</code>; value type: <code>Operator</code>).
         */
        private static final Map KEYWORDS;

        static {
            KEYWORDS = new HashMap(2);
            ModuleModifierKeyword[] ops = { STATIC_KEYWORD, TRANSITIVE_KEYWORD, };
            for (ModuleModifierKeyword op : ops) {
                KEYWORDS.put(op.toString(), op);
            }
        }

        /**
         * The keyword module modifier string.
         */
        private final String keyword;

        /**
         * Creates a new module modifier with the given keyword. <p> Note: this constructor is private. The only
         * instances ever created are the ones for the standard modifiers. </p>
         *
         * @param keyword the character sequence for the module modifier
         */
        private ModuleModifierKeyword(String keyword) {
            this.keyword = keyword;
        }

        /**
         * Returns the keyword for the module modifier.
         *
         * @return the keyword for the module modifier
         */
        @Override
        public String toString() {
            return this.keyword;
        }
    }

    /**
     * The "keyword" structural property of this node type (type: {@link ModuleModifier.ModuleModifierKeyword}).
     */
    public static final SimplePropertyDescriptor KEYWORD_PROPERTY
        = new SimplePropertyDescriptor(ModuleModifier.class, "keyword", ModuleModifier.ModuleModifierKeyword.class); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(2);
        createPropertyList(ModuleModifier.class, properyList);
        addProperty(KEYWORD_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The modifier keyword; defaults to an unspecified modifier.
     */
    private ModuleModifierKeyword modifierKeyword = ModuleModifierKeyword.STATIC_KEYWORD;

    /**
     * Creates a new unparented MODULE modifier node owned by the given AST. By default, the node has unspecified (but
     * legal) modifier. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    ModuleModifier(AST ast) {
        super(ast);
        unsupportedBelow9();
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);
    }

    /**
     * Returns the modifier keyword of this modifier node.
     *
     * @return the modifier keyword
     */
    public ModuleModifierKeyword getKeyword() {
        return this.modifierKeyword;
    }

    /**
     * Sets the module modifier keyword of this module modifier node.
     *
     * @param modifierKeyord the module modifier keyword
     * @exception IllegalArgumentException if the argument is <code>null</code>
     */
    public void setKeyword(ModuleModifierKeyword modifierKeyord) {
        if (modifierKeyord == null) {
            throw new IllegalArgumentException();
        }
        preValueChange();
        this.modifierKeyword = modifierKeyord;

    }

    @Override
    final int getNodeType0() {
        return 99;
    }
}
