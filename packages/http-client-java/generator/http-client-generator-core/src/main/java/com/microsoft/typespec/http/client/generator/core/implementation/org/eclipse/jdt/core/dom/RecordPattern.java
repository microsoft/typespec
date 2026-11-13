// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2022, 2024 IBM Corporation and others.
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
import java.util.List;

/**
 * TypePattern pattern AST node type.
 *
 * <pre>
 * {@code
 * RecordPattern:
 *      Pattern<Pattern<Patterns....>> Type SimpleName
 * }
 * </pre>
 *
 * @since 3.31
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class RecordPattern extends Pattern {

    /**
     * The "patterns" structural property of this node type (child type: {@link Pattern}).
     */
    public static final ChildListPropertyDescriptor PATTERNS_PROPERTY
        = new ChildListPropertyDescriptor(RecordPattern.class, "patterns", Pattern.class, true); //$NON-NLS-1$

    /**
     * The "patternType" structural property of this node type (child type: {@link Type}).
     */
    public static final ChildPropertyDescriptor PATTERN_TYPE_PROPERTY
        = new ChildPropertyDescriptor(RecordPattern.class, "patternType", Type.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(5);
        createPropertyList(RecordPattern.class, properyList);
        addProperty(PATTERN_TYPE_PROPERTY, properyList);
        addProperty(PATTERNS_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    @Override
    int getNodeType0() {
        return 113;
    }

    RecordPattern(AST ast) {
        super(ast);
        supportedOnlyIn21();
    }

    /**
     * The pattern type;
     */
    private volatile Type patternType;

    /**
     * The patterns (element type: {@link Pattern}). Defaults to an empty list.
     */
    private final ASTNode.NodeList patterns = new ASTNode.NodeList(PATTERNS_PROPERTY);

    /**
     * Sets the pattern type.
     *
     * @param patternType the right operand node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @exception UnsupportedOperationException if this operation is used other than JLS21
     * @exception UnsupportedOperationException if this expression is used with previewEnabled flag as false
     * @since 3.38
     */
    public void setPatternType(Type patternType) {
        supportedOnlyIn21();
        if (patternType == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.patternType;
        preReplaceChild(oldChild, patternType, PATTERN_TYPE_PROPERTY);
        this.patternType = patternType;

    }

    /**
     * Returns the pattern type of Types Pattern.
     *
     * @return the pattern type
     * @exception UnsupportedOperationException if this operation is used other than JLS21
     * @exception UnsupportedOperationException if this expression is used with previewEnabled flag as false
     * @since 3.38
     */
    public Type getPatternType() {
        supportedOnlyIn21();
        if (this.patternType == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.patternType == null) {
                    this.patternType
                        = postLazyInit(this.ast.newPrimitiveType(PrimitiveType.INT), PATTERN_TYPE_PROPERTY);
                }
            }
        }
        return this.patternType;
    }

    /**
     * Returns the nested Pattern list.
     *
     * @return the live list of pattern nodes (element type: {@link Pattern})
     * @exception UnsupportedOperationException if this operation is used other than JLS21
     * @exception UnsupportedOperationException if this expression is used with previewEnabled flag as false
     * @since 3.38
     */
    @SuppressWarnings("unchecked")
    public List<Pattern> patterns() {
        supportedOnlyIn21();
        return this.patterns;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.patterns);
            acceptChild(visitor, getPatternType());
        }
        visitor.endVisit(this);
    }
}
