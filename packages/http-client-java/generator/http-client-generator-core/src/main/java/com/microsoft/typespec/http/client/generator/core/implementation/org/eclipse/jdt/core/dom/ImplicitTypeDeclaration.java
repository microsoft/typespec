// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
import java.util.List;

/**
 * @since 3.38
 * @noreference
 */
public class ImplicitTypeDeclaration extends AbstractTypeDeclaration {

    @Deprecated
    public static final SimplePropertyDescriptor MODIFIERS_PROPERTY
        = internalModifiersPropertyFactory(ImplicitTypeDeclaration.class);

    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY
        = internalModifiers2PropertyFactory(ImplicitTypeDeclaration.class);

    public static final ChildPropertyDescriptor JAVADOC_PROPERTY
        = internalJavadocPropertyFactory(ImplicitTypeDeclaration.class);

    public static final ChildListPropertyDescriptor BODY_DECLARATIONS_PROPERTY
        = internalBodyDeclarationPropertyFactory(ImplicitTypeDeclaration.class);

    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(ImplicitTypeDeclaration.class, "name", SimpleName.class, false); //$NON-NLS-1$

    static {
        List<Object> propertyList = new ArrayList<>(8);
        createPropertyList(ImplicitTypeDeclaration.class, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        addProperty(BODY_DECLARATIONS_PROPERTY, propertyList);
        addProperty(JAVADOC_PROPERTY, propertyList);
        addProperty(MODIFIERS_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList<>(8);
        createPropertyList(ImplicitTypeDeclaration.class, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        addProperty(BODY_DECLARATIONS_PROPERTY, propertyList);
        addProperty(JAVADOC_PROPERTY, propertyList);
        addProperty(MODIFIERS2_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    ImplicitTypeDeclaration(AST ast) {
        super(ast);
    }

    @Override
    SimplePropertyDescriptor internalModifiersProperty() {
        return MODIFIERS_PROPERTY;
    }

    @Override
    ChildListPropertyDescriptor internalModifiers2Property() {
        return MODIFIERS2_PROPERTY;
    }

    @Override
    ChildPropertyDescriptor internalJavadocProperty() {
        return JAVADOC_PROPERTY;
    }

    @Override
    int getNodeType0() {
        return 115;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, getJavadoc());
            acceptChildren(visitor, this.bodyDeclarations);
        }
    }

    @Override
    final ChildListPropertyDescriptor internalBodyDeclarationsProperty() {
        return BODY_DECLARATIONS_PROPERTY;
    }

    @Override
    public SimpleName getName() {
        if (this.typeName == null) {
            synchronized (this) {
                if (this.typeName == null) {
                    EmptyName e = new EmptyName(this.ast);
                    e.setSourceRange(this.getStartPosition(), 0);
                    this.typeName = postLazyInit(e, NAME_PROPERTY);
                }
            }
        }
        return this.typeName;
    }

    @Override
    public ChildPropertyDescriptor internalNameProperty() {
        return NAME_PROPERTY;
    }

    private final class EmptyName extends SimpleName {
        private EmptyName(AST ast) {
            super(ast);
        }

        @Override
        public String getIdentifier() {
            return ""; //$NON-NLS-1$
        }

        @Override
        public void setIdentifier(String newIdentifier) {
            throw new IllegalArgumentException(
                "Cannot change the name of an implicitly declared class; it must be the empty string"); //$NON-NLS-1$
        }
    }
}
