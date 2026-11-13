// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2022 IBM Corporation and others.
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
 * JavaDocRegion pattern AST node type.
 *
 * <pre>
 * JavaDocRegion:
 *     [ TagElement { <b>,</b> TagElement } ]
 *     [ ASTNode { [TextElement] [JavaDocRegion] } ]
 *     validSnippet
 * </pre>
 *
 * @since 3.30
 */
@SuppressWarnings("rawtypes")
public class JavaDocRegion extends AbstractTagElement {

    JavaDocRegion(AST ast) {
        super(ast);
        unsupportedBelow18();
    }

    /**
     * The "tagName" structural property of this node type (type: {@link String}).
     */
    public static final SimplePropertyDescriptor TAG_NAME_PROPERTY
        = internalTagNamePropertyFactory(JavaDocRegion.class);
    /**
     * The "fragments" structural property of this node type (element type: {@link IDocElement}). These are the
     * containers which will have texts and other JavaDoc regions
     */
    public static final ChildListPropertyDescriptor FRAGMENTS_PROPERTY
        = internalFragmentsPropertyFactory(JavaDocRegion.class);

    /**
     * The "tags" structural property of this node type (child type: {@link TagElement}). (added in JEP 413). These are
     * the decorators like link, highlight etc
     */
    public static final ChildListPropertyDescriptor TAGS_PROPERTY
        = new ChildListPropertyDescriptor(JavaDocRegion.class, "tags", TagElement.class, true); //$NON-NLS-1$ );

    /**
     * The "dummy regions" structural property of this node type (added in JEP 413).
     */
    public static final SimplePropertyDescriptor DUMMY_REGION_PROPERTY
        = new SimplePropertyDescriptor(JavaDocRegion.class, "dummyRegion", boolean.class); //$NON-NLS-1$ );

    /**
     * The "validSnippet" structural property of this node type (added in JEP 413).
     */
    public static final SimplePropertyDescriptor VALID_SNIPPET_PROPERTY
        = new SimplePropertyDescriptor(JavaDocRegion.class, "validSnippet", boolean.class); //$NON-NLS-1$ );

    static {
        List propertyList = new ArrayList(6);
        createPropertyList(JavaDocRegion.class, propertyList);
        addProperty(TAG_NAME_PROPERTY, propertyList);
        addProperty(FRAGMENTS_PROPERTY, propertyList);
        addProperty(TAGS_PROPERTY, propertyList);
        addProperty(DUMMY_REGION_PROPERTY, propertyList);
        addProperty(VALID_SNIPPET_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The tags list; <code>empty</code> for none;
     */
    private final ASTNode.NodeList tags = new ASTNode.NodeList(TAGS_PROPERTY);

    /**
     * The property dummyRegion
     */
    private boolean dummyRegion = Boolean.TRUE;

    {
        boolean _typespecDiscarded_validSnippet = Boolean.TRUE;
    }

    @Override
    int getNodeType0() {
        return 111;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);
        visitor.endVisit(this);
    }

    /**
     * Returns the list of tag elements in this region, or <code>empty</code> if there is none.
     *
     * @return the list of tag element nodes (element type: {@link TagElement})
     * @exception UnsupportedOperationException if this operation is used below JLS18
     */
    public List tags() {
        unsupportedBelow18();
        return this.tags;
    }

    /**
     * Returns <code>true</code> is region is dummy else <code>false</code>.
     *
     * @return the dummyRegion
     * @exception UnsupportedOperationException if this operation is used below JLS18
     */
    public boolean isDummyRegion() {
        unsupportedBelow18();
        return this.dummyRegion;
    }

    /**
     * Sets the value of dummyRegion property.
     *
     * @exception UnsupportedOperationException if this operation is used below JLS18
     */
    public void setDummyRegion() {

        unsupportedBelow18();
        preValueChange();
        this.dummyRegion = false;

    }

    @Override
    ChildListPropertyDescriptor internalFragmentsPropertyFactory() {
        return FRAGMENTS_PROPERTY;
    }

}
