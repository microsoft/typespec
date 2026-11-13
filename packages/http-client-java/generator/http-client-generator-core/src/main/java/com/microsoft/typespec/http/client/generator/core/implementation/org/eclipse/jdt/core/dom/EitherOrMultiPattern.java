// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
* Copyright (c) 2024 Advantest Europe GmbH and others.
*
* This program and the accompanying materials
* are made available under the terms of the Eclipse Public License 2.0
* which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-2.0/
*
* SPDX-License-Identifier: EPL-2.0
*
* Contributors:
*     Srikanth Sankaran - initial implementation
*******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
import java.util.List;

/**
 * EitherOrMultiPattern AST node type.
 *
 * <pre>
 * {@code
 * EitherOrMultiPattern:
 *      Pattern, Pattern, Pattern....
 * }
 * </pre>
 *
 * @since 3.37
 * @noinstantiate This class is not intended to be instantiated by clients.
 * @noreference This class is not intended to be referenced by clients.
 */
@SuppressWarnings("rawtypes")
public class EitherOrMultiPattern extends Pattern {

    /**
     * The "patterns" structural property of this node type (child type: {@link Pattern}).
     */
    public static final ChildListPropertyDescriptor PATTERNS_PROPERTY
        = new ChildListPropertyDescriptor(EitherOrMultiPattern.class, "patterns", Pattern.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(5);
        createPropertyList(EitherOrMultiPattern.class, properyList);
        addProperty(PATTERNS_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    @Override
    int getNodeType0() {
        return 114;
    }

    EitherOrMultiPattern(AST ast) {
        super(ast);
        supportedOnlyIn21();
    }

    /**
     * The patterns (element type: {@link Pattern}). Defaults to an empty list.
     */
    private final ASTNode.NodeList patterns = new ASTNode.NodeList(PATTERNS_PROPERTY);

    /**
     * Returns the "alternatives" Pattern list.
     *
     * @return the live list of pattern nodes (element type: {@link Pattern})
     * @exception UnsupportedOperationException if this operation is used other than JLS21
     * @exception UnsupportedOperationException if this expression is used with previewEnabled flag as false
     * @noreference This method is not intended to be referenced by clients as it is a part of Java preview feature.
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
        }
        visitor.endVisit(this);
    }
}
