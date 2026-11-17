// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * @since 3.38
 * @noreference
 */
public class ImplicitTypeDeclaration extends AbstractTypeDeclaration {

    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY = internalModifiers2PropertyFactory();

    public static final ChildPropertyDescriptor JAVADOC_PROPERTY = internalJavadocPropertyFactory();

    public static final ChildListPropertyDescriptor BODY_DECLARATIONS_PROPERTY
        = internalBodyDeclarationPropertyFactory();

    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    ImplicitTypeDeclaration(AST ast) {
        super(ast);
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
            EmptyName e = new EmptyName(this.ast);
            e.setSourceRange(this.getStartPosition(), 0);
            this.typeName = postLazyInit(e, NAME_PROPERTY);
        }
        return this.typeName;
    }

    @Override
    public ChildPropertyDescriptor internalNameProperty() {
        return NAME_PROPERTY;
    }

    private static final class EmptyName extends SimpleName {
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
