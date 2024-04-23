// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Writers;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Base class for code model plugins. This class is exported via MEF and can be implemented by an inherited plugin class.
    /// </summary>
    [InheritedExport]
    public abstract class CodeModelPlugin
    {
        private static CodeModelPlugin? _instance;
        internal static CodeModelPlugin Instance => _instance ?? throw new InvalidOperationException("CodeModelPlugin is not initialized");

        public Configuration Configuration { get; }

        [ImportingConstructor]
        public CodeModelPlugin(GeneratorContext context)
        {
            _instance = this;
            Configuration = context.Configuration;
        }

        // Extensibility points to be implemented by a plugin
        public abstract ApiTypes ApiTypes { get; }
        public abstract CodeWriterExtensionMethods CodeWriterExtensionMethods { get; }
        public abstract TypeFactory TypeFactory { get; }
        public abstract ExtensibleSnippets ExtensibleSnippets { get; }
        public abstract OutputLibrary GetOutputLibrary(InputNamespace input);
        public virtual ExpressionTypeProviderWriter GetExpressionTypeProviderWriter(CodeWriter writer, ModelTypeProvider model) => new ExpressionTypeProviderWriter(writer, model);
    }
}
