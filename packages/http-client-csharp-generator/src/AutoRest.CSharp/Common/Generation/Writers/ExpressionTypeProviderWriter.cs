// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Linq;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Generation.Writers
{
    internal class ExpressionTypeProviderWriter
    {
        private readonly ExpressionTypeProvider _provider;
        private readonly CodeWriter _writer;

        public ExpressionTypeProviderWriter(CodeWriter writer, ExpressionTypeProvider provider)
        {
            _provider = provider;
            _writer = writer;
        }

        public virtual void Write()
        {
            foreach (var @using in _provider.Usings)
            {
                _writer.UseNamespace(@using);
            }

            using (_writer.Namespace(_provider.Declaration.Namespace))
            {
                _writer.WriteClassModifiers(_provider.DeclarationModifiers);
                _writer.Append($" class {_provider.Type:D}")
                    .AppendRawIf(" : ", _provider.Inherits != null || _provider.Implements.Any())
                    .AppendIf($"{_provider.Inherits},", _provider.Inherits != null);

                foreach (var implement in _provider.Implements)
                {
                    _writer.Append($"{implement:D},");
                }
                _writer.RemoveTrailingComma();

                using (_writer.Scope())
                {
                    WriteFields();

                    WriteConstructors();

                    WriteProperties();

                    WriteMethods();
                }
            }
        }

        protected virtual void WriteProperties()
        {
            foreach (var property in _provider.Properties)
            {
                _writer.WriteProperty(property);
                _writer.Line();
            }
        }

        protected virtual void WriteFields()
        {
            foreach (var field in _provider.Fields)
            {
                _writer.WriteField(field, declareInCurrentScope: true);
            }
            _writer.Line();
        }

        protected virtual void WriteConstructors()
        {
            foreach (var ctor in _provider.Constructors)
            {
                _writer.WriteMethod(ctor);
            }
        }

        protected virtual void WriteMethods()
        {
            foreach (var method in _provider.Methods)
            {
                _writer.WriteMethod(method);
            }
        }
    }
}
