// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2022 IBM Corporation and others.
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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.dom.util.DOMASTUtil;
import java.util.ArrayList;
import java.util.List;

/**
 * AST node for a tag within a doc comment. Tag elements nested within another tag element are called inline doc tags.
 *
 * <pre>
 * TagElement:
 *     [ <b>@</b> Identifier ] { DocElement }
 *     {tagProperty = tagValue}
 * DocElement:
 *     TextElement
 *     Name
 *     MethodRef
 *     MemberRef
 *     <b>{</b> TagElement <b>}</b>
 * </pre>
 *
 * @see Javadoc
 * @since 3.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public final class TagElement extends AbstractTagElement {

    /**
     * The "tagName" structural property of this node type (type: {@link String}).
     */
    public static final SimplePropertyDescriptor TAG_NAME_PROPERTY = internalTagNamePropertyFactory(TagElement.class);
    /**
     * The "fragments" structural property of this node type (element type: {@link IDocElement}).
     */
    public static final ChildListPropertyDescriptor FRAGMENTS_PROPERTY
        = internalFragmentsPropertyFactory(TagElement.class);

    /**
     * The "properties" structural property of this node type (element type: {@link TagProperty}).
     *
     * @since 3.30
     */
    public static final ChildListPropertyDescriptor TAG_PROPERTIES_PROPERTY
        = new ChildListPropertyDescriptor(TagElement.class, "tagProperties", TagProperty.class, true); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(TagElement.class, propertyList);
        addProperty(TAG_NAME_PROPERTY, propertyList);
        addProperty(FRAGMENTS_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(4);
        createPropertyList(TagElement.class, propertyList);
        addProperty(TAG_NAME_PROPERTY, propertyList);
        addProperty(FRAGMENTS_PROPERTY, propertyList);
        addProperty(TAG_PROPERTIES_PROPERTY, propertyList);

        reapPropertyList(propertyList);
    }

    @Override
    final ChildListPropertyDescriptor internalFragmentsPropertyFactory() {
        return FRAGMENTS_PROPERTY;
    }

    /**
     * The list of doc elements (element type: {@link TagProperty}). Defaults to an empty list.
     */
    private final ASTNode.NodeList tagProperties = new ASTNode.NodeList(TAG_PROPERTIES_PROPERTY);

    /**
     * Creates a new AST node for a tag element owned by the given AST. The new node has no name and an empty list of
     * fragments. <p> N.B. This constructor is package-private; all subclasses must be declared in the same package;
     * clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    TagElement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 65;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChildren(visitor, this.fragments);
            if (DOMASTUtil.isJavaDocCodeSnippetSupported(this.getAST().apiLevel)) {
                acceptChildren(visitor, this.tagProperties);
            }
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the live list of tag properties in this tag element.
     *
     * @return the live list of properties in this tag element (element type: {@link TagProperty})
     * @exception UnsupportedOperationException if this operation is used less than JLS18
     * @since 3.30
     */
    public List tagProperties() {
        unsupportedBelow18();
        return this.tagProperties;
    }

    /**
     * Returns the list of non dummy JavaDocRegion elements in this tag element.
     *
     * @return the list of non dummy JavaDocRegion elements in this tag element. (element type: {@link JavaDocRegion})
     * @exception UnsupportedOperationException if this operation is used less than JLS18
     * @since 3.30
     */
    public List tagRegions() {
        unsupportedBelow18();
        List<JavaDocRegion> regions = new ArrayList<>();
        List<Object> frags = this.fragments();
        if (frags != null) {
            for (Object fragment : frags) {
                if (fragment instanceof JavaDocRegion && !((JavaDocRegion) fragment).isDummyRegion()) {
                    regions.add((JavaDocRegion) fragment);
                }
            }
        }
        return regions;
    }
}
