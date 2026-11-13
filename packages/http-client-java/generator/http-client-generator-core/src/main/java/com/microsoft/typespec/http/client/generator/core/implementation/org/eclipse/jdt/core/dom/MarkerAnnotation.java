// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2019 IBM Corporation and others.
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
 * Marker annotation node (added in JLS3 API). The marker annotation "@foo" is equivalent to the normal annotation
 * "@foo()".
 *
 * <pre>
 * MarkerAnnotation:
 *   <b>@</b> TypeName
 * </pre>
 *
 * @since 3.1
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public final class MarkerAnnotation extends Annotation {

    /**
     * The "typeName" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor TYPE_NAME_PROPERTY
        = internalTypeNamePropertyFactory(MarkerAnnotation.class);

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(MarkerAnnotation.class, propertyList);
        addProperty(TYPE_NAME_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * Creates a new unparented marker annotation node owned by the given AST. By default, the annotation has an
     * unspecified type name . <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    MarkerAnnotation(AST ast) {
        super(ast);
        unsupportedIn2();
    }

    @Override
    final ChildPropertyDescriptor internalTypeNameProperty() {
        return TYPE_NAME_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 78;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getTypeName());
        }
        visitor.endVisit(this);
    }
}
