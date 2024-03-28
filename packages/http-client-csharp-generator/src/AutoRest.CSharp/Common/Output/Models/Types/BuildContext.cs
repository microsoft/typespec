// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class BuildContext
    {
        public BuildContext(CodeModel codeModel, SourceInputModel? sourceInputModel) : this(codeModel, sourceInputModel, Configuration.LibraryName, Configuration.Namespace)
        { }

        public BuildContext(CodeModel codeModel, SourceInputModel? sourceInputModel, string defaultLibraryName, string defaultNamespace)
        {
            CodeModel = codeModel;
            SchemaUsageProvider = new SchemaUsageProvider(codeModel);
            SourceInputModel = sourceInputModel;
            DefaultLibraryName = defaultLibraryName;
            DefaultNamespace = defaultNamespace;
        }

        public OutputLibrary? BaseLibrary { get; protected set; }

        public CodeModel CodeModel { get; }
        public SchemaUsageProvider SchemaUsageProvider { get; }
        public string DefaultName => CodeModel.Language.Default.Name;
        public string DefaultNamespace { get; }
        public string DefaultLibraryName { get; }
        public SourceInputModel? SourceInputModel { get; }
        public virtual TypeFactory TypeFactory { get; } = null!;
    }
}
