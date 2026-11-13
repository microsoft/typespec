// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime.Status;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IDocument;
import com.microsoft.typespec.http.client.generator.core.postprocessor.implementation.CodeFormatterUtil;
import java.util.List;
import org.junit.jupiter.api.Test;

public class VendoredInterfacePruningTests {
    private static final String NAMESPACE = "com/microsoft/typespec/http/client/generator/core/implementation/";

    @Test
    public void unnecessaryInterfacesAndTheirDeadHelpersAreNotShipped() {
        assertNotShipped("org/eclipse/core/runtime/ILogListener",
            "org/eclipse/core/runtime/content/IContentTypeSettings",
            "org/eclipse/jdt/internal/compiler/lookup/IQualifiedTypeResolutionListener",
            "org/eclipse/jdt/internal/core/JavaModelOperation$IPostAction",
            "org/eclipse/jdt/core/ITypeHierarchyChangedListener", "org/eclipse/jdt/internal/core/util/ILRUCacheable",
            "org/eclipse/jface/text/IDocumentPartitioningListener",
            "org/eclipse/jface/text/IDocumentPartitioningListenerExtension",
            "org/eclipse/jface/text/IDocumentPartitioningListenerExtension2",
            "org/eclipse/jface/text/DocumentPartitioningChangedEvent",
            "org/eclipse/jdt/internal/core/ExternalJavadocSupport", "org/eclipse/jdt/internal/core/IJavadocContents",
            "org/eclipse/jdt/internal/core/JavadocContents", "org/eclipse/jdt/internal/core/JavadocContents17",
            "org/eclipse/jdt/internal/compiler/util/Tuples", "org/eclipse/jdt/internal/codeassist/impl/Keywords",
            "org/osgi/service/url/URLConstants", "org/osgi/framework/hooks/bundle/CollisionHook",
            "org/osgi/framework/hooks/service/ListenerHook", "org/osgi/framework/hooks/weaving/WovenClassListener");
    }

    @Test
    public void singleImplementationAndMarkerTypesAreFolded() {
        assertNotShipped("org/eclipse/core/runtime/IStatus", "org/eclipse/core/runtime/CoreException",
            "org/eclipse/core/runtime/OperationCanceledException", "org/eclipse/jdt/core/JavaModelException",
            "org/eclipse/jdt/core/dom/BindingResolver", "org/eclipse/jdt/internal/compiler/env/IDependent",
            "org/eclipse/jdt/internal/compiler/lookup/Binding", "org/eclipse/jdt/internal/compiler/lookup/TypeBinding",
            "org/eclipse/jdt/internal/compiler/lookup/BaseTypeBinding",
            "org/eclipse/jdt/internal/compiler/lookup/VoidTypeBinding",
            "org/eclipse/jdt/internal/compiler/lookup/TypeIds", "org/eclipse/jdt/internal/compiler/ast/OperatorIds",
            "org/eclipse/jdt/internal/compiler/ast/StatementWithFinallyBlock",
            "org/eclipse/jdt/internal/compiler/parser/JavadocTagConstants",
            "org/eclipse/jdt/internal/compiler/util/SuffixConstants");
        assertEquals(Object.class, Status.class.getSuperclass());
        assertEquals(0, Status.class.getInterfaces().length);
    }

    @Test
    public void documentUpdatesDoNotNeedPartitioningListeners() throws Exception {
        IDocument document = new IDocument("before");
        document.replace(0, document.getLength(), "after\n");
        assertEquals("after\n", document.get());
        assertEquals(6, document.getLength());
    }

    private static void assertNotShipped(String... names) {
        ClassLoader loader = CodeFormatterUtil.class.getClassLoader();
        for (String name : List.of(names)) {
            assertNull(loader.getResource(NAMESPACE + name + ".class"), name);
        }
    }
}
