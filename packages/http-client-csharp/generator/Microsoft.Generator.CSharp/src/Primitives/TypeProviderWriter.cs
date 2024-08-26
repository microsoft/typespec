// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Primitives
{
    public class TypeProviderWriter
    {
        protected readonly TypeProvider _provider;

        public TypeProviderWriter(TypeProvider provider)
        {
            _provider = provider;
        }

        public virtual CodeFile Write()
        {
            using var writer = new CodeWriter();
            using (var ns = writer.SetNamespace(_provider.Type.Namespace))
            {
                WriteType(writer);
            }
            return new CodeFile(writer.ToString(), _provider.RelativeFilePath);
        }

        private bool IsPublicContext(TypeProvider provider)
        {
            return provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public) &&
                (provider.DeclaringTypeProvider is null || IsPublicContext(provider.DeclaringTypeProvider));
        }

        private void WriteType(CodeWriter writer)
        {
            if (IsPublicContext(_provider))
            {
                writer.WriteXmlDocs(_provider.XmlDocs);
            }
            foreach (var attribute in _provider.Attributes)
            {
                attribute.Write(writer);
            }
            writer.WriteTypeModifiers(_provider.DeclarationModifiers); // class, struct, enum and interface is written as modifiers in this part
            writer.Append($"{_provider.Type:D}")
                .AppendRawIf(" : ", _provider.Type.BaseType != null || _provider.Implements.Any())
                .AppendIf($"{_provider.Type.BaseType}", _provider.Type.BaseType != null);

            writer.AppendRawIf(", ", _provider.Type.BaseType != null && _provider.Implements.Count > 0);

            for (int i = 0; i < _provider.Implements.Count; i++)
            {
                writer.Append($"{_provider.Implements[i]:D}");
                if (i < _provider.Implements.Count - 1)
                {
                    writer.AppendRaw(", ");
                }
            }

            if (_provider.WhereClause is not null)
            {
                using (writer.ScopeRaw(string.Empty, string.Empty, false))
                {
                    _provider.WhereClause.Write(writer);
                }
            }

            writer.WriteLine();

            if (_provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Enum))
            {
                WriteEnumContent(writer);
            }
            else if (_provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Interface))
            {
                WriteInterfaceContent(writer);
            }
            else
            {
                WriteClassOrStructContent(writer);
            }
        }

        private void WriteClassOrStructContent(CodeWriter writer)
        {
            using (writer.Scope())
            {
                bool sectionWritten = _provider.Fields.Any();
                WriteFields(writer);

                if (sectionWritten && _provider.Constructors.Any())
                    writer.WriteLine();
                WriteConstructors(writer);
                sectionWritten |= _provider.Constructors.Any();

                if (sectionWritten && _provider.Properties.Any())
                    writer.WriteLine();
                WriteProperties(writer);
                sectionWritten |= _provider.Properties.Any();

                if (sectionWritten && _provider.Methods.Any())
                    writer.WriteLine();
                WriteMethods(writer);
                sectionWritten |= _provider.Methods.Any();

                if (sectionWritten = _provider.NestedTypes.Any())
                    writer.WriteLine();
                WriteNestedTypes(writer);
            }
        }

        private void WriteEnumContent(CodeWriter writer)
        {
            using (writer.Scope())
            {
                for (int i = 0; i < _provider.Fields.Count; i++)
                {
                    writer.WriteXmlDocs(_provider.Fields[i].XmlDocs);
                    writer.Append($"{_provider.Fields[i].Name}");
                    if (_provider.Fields[i].InitializationValue != null)
                    {
                        writer.AppendRaw(" = ");
                        _provider.Fields[i].InitializationValue!.Write(writer);
                    }
                    if (i < _provider.Fields.Count - 1)
                    {
                        writer.WriteRawLine(",");
                    }
                }
                writer.WriteLine();
            }
        }

        private void WriteInterfaceContent(CodeWriter writer)
        {
            using (writer.Scope())
            {
                // temporarily do nothing until we have a requirement for writing interfaces: https://github.com/microsoft/typespec/issues/3442
            }
        }

        private void WriteProperties(CodeWriter writer)
        {
            for (int i = 0; i < _provider.Properties.Count; i++)
            {
                var property = _provider.Properties[i];
                writer.WriteProperty(property, property.Modifiers.HasFlag(MethodSignatureModifiers.Public) && IsPublicContext(_provider));
                if (i < _provider.Properties.Count - 1)
                {
                    writer.WriteLine();
                }
            }
        }

        private void WriteFields(CodeWriter writer)
        {
            for (int i = 0; i < _provider.Fields.Count; i++)
            {
                writer.WriteField(_provider.Fields[i]);
            }
        }

        private void WriteConstructors(CodeWriter writer)
        {
            for (int i = 0; i < _provider.Constructors.Count; i++)
            {
                writer.WriteConstructor(_provider.Constructors[i]);
                if (i < _provider.Constructors.Count - 1)
                {
                    writer.WriteLine();
                }
            }
        }

        private void WriteMethods(CodeWriter writer)
        {
            for (int i = 0; i < _provider.Methods.Count; i++)
            {
                writer.WriteMethod(_provider.Methods[i]);
                if (i < _provider.Methods.Count - 1)
                {
                    writer.WriteLine();
                }
            }
        }

        private void WriteNestedTypes(CodeWriter writer)
        {
            for (int i = 0; i < _provider.NestedTypes.Count; i++)
            {
                var nestedWriter = new TypeProviderWriter(_provider.NestedTypes[i]);
                nestedWriter.WriteType(writer);
                if (i < _provider.NestedTypes.Count - 1)
                {
                    writer.WriteLine();
                }
            }
        }
    }
}
