// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Generation.Writers
{
    internal class ModelFactoryWriter
    {
        protected CodeWriter _writer;
        private ModelFactoryTypeProvider This { get; }

        public ModelFactoryWriter(ModelFactoryTypeProvider modelFactoryProvider) : this(new CodeWriter(), modelFactoryProvider)
        {
        }

        public ModelFactoryWriter(CodeWriter writer, ModelFactoryTypeProvider modelFactoryProvider)
        {
            _writer = writer;
            This = modelFactoryProvider;
        }

        public void Write()
        {
            using (_writer.Namespace(This.Type.Namespace))
            {
                _writer.WriteXmlDocumentationSummary(This.Description);
                using (_writer.Scope($"{This.Declaration.Accessibility} static partial class {This.Type:D}"))
                {
                    foreach (var method in This.Methods)
                    {
                        _writer.WriteMethodDocumentation(method.Signature);
                        _writer.WriteMethod(method);
                    }
                }
            }
        }

        public override string ToString()
        {
            return _writer.ToString();
        }
    }
}
