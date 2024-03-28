// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.MgmtTest.Extensions;
using AutoRest.CSharp.MgmtTest.Models;
using AutoRest.CSharp.MgmtTest.Output;
using AutoRest.CSharp.Utilities;
using Azure.Core;
using Azure.ResourceManager;
using Azure.ResourceManager.Resources;

namespace AutoRest.CSharp.MgmtTest.Generation
{
    internal abstract class MgmtTestWriterBase<TProvider> where TProvider : MgmtTestProvider
    {
        protected CodeWriter _writer;

        protected TProvider This { get; }

        protected MgmtTestWriterBase(TProvider provider) : this(new CodeWriter(), provider)
        {
        }

        protected MgmtTestWriterBase(CodeWriter writer, TProvider provider)
        {
            _writer = writer;
            This = provider;
        }

        public abstract void Write();

        protected virtual void WriteClassDeclaration()
        {
            _writer.WriteXmlDocumentationSummary(This.Description);
            _writer.Append($"{This.Accessibility} partial class {This.Type.Name}");
            if (This.BaseType != null)
            {
                _writer.Append($" : {This.BaseType:D}");
            }
            _writer.Line();
        }

        protected virtual void WriteCreateResourceIdentifier(OperationExample example, CodeWriterDeclaration idDeclaration, RequestPath resourcePath, CSharpType resourceType)
        {
            var resourceIdExpressionValues = example.ComposeResourceIdentifierExpressionValues(resourcePath).ToList();
            foreach (var initializer in resourceIdExpressionValues)
            {
                if (initializer.ScopeValues is not null)
                {
                    foreach (var value in initializer.ScopeValues)
                    {
                        var parameterDeclaration = new CodeWriterVariableDeclaration(value.Name, value.Type);
                        _writer.AppendDeclaration(parameterDeclaration).AppendRaw(" = ")
                            .AppendExampleParameterValue(value).LineRaw(";");
                    }
                }
            }
            _writer.Append($"{typeof(ResourceIdentifier)} {idDeclaration:D} = {resourceType}.CreateResourceIdentifier(");
            foreach (var initializer in resourceIdExpressionValues)
            {
                if (initializer.Value is not null)
                    _writer.AppendExampleParameterValue(initializer.Value).AppendRaw(",");
                else
                {
                    _writer.AppendRaw("$\"").AppendRaw(initializer.Scope!.ToString()!).AppendRaw("\"").AppendRaw(",");
                }
            }
            _writer.RemoveTrailingComma();
            _writer.Line($");");
        }

        protected virtual void WriteCreateScopeResourceIdentifier(OperationExample example, CodeWriterDeclaration declaration, RequestPath requestPath)
        {
            var resourceIdExpressionValues = example.ComposeResourceIdentifierExpressionValues(requestPath).ToList();
            foreach (var initializer in resourceIdExpressionValues)
            {
                if (initializer.ScopeValues is not null)
                {
                    foreach (var value in initializer.ScopeValues)
                    {
                        var parameterDeclaration = new CodeWriterVariableDeclaration(value.Name, value.Type);
                        _writer.AppendDeclaration(parameterDeclaration).AppendRaw(" = ")
                            .AppendExampleParameterValue(value).LineRaw(";");
                    }
                }
            }
            _writer.Append($"{typeof(ResourceIdentifier)} {declaration:D} = new {typeof(ResourceIdentifier)}(");
            // we do not know exactly which resource the scope is, therefore we need to use the string.Format method to include those parameter values and construct a valid resource id of the scope
            _writer.Append($"{typeof(string)}.Format(\"");
            int refIndex = 0;
            foreach (var segment in requestPath)
            {
                _writer.AppendRaw("/");
                if (segment.IsConstant)
                    _writer.AppendRaw(segment.ConstantValue);
                else
                    _writer.Append($"{{{refIndex++}}}");
            }
            _writer.AppendRaw("\", ");
            foreach (var initializer in resourceIdExpressionValues)
            {
                if (initializer.Value is not null)
                    _writer.AppendExampleParameterValue(initializer.Value).AppendRaw(",");
                else
                {
                    _writer.AppendRaw("$\"").AppendRaw(initializer.Scope!.ToString()!).AppendRaw("\"").AppendRaw(",");
                }
            }
            _writer.RemoveTrailingComma();
            _writer.LineRaw("));");
        }

        protected CodeWriterDeclaration WriteGetResource(MgmtTypeProvider carrierResource, OperationExample example, FormattableString client)
            => carrierResource switch
            {
                ResourceCollection => throw new InvalidOperationException($"ResourceCollection is not supported here"),
                Resource parentResource => WriteGetFromResource(parentResource, example, client),
                MgmtExtension parentExtension => WriteGetExtension(parentExtension, example, client),
                _ => throw new InvalidOperationException($"Unknown parent {carrierResource.GetType()}"),
            };

        protected CodeWriterDeclaration WriteGetFromResource(Resource carrierResource, OperationExample example, FormattableString client)
        {
            // Can't use CSharpType.Equals(typeof(...)) because the CSharpType.Equals(Type) would assume itself is a FrameworkType, but here it's generated when IsArmCore=true
            if (Configuration.MgmtConfiguration.IsArmCore && carrierResource.Type.Name == nameof(TenantResource))
            {
                return WriteGetTenantResource(carrierResource, example, client);
            }
            else
            {
                var idVar = new CodeWriterDeclaration($"{carrierResource.Type.Name}Id".ToVariableName());
                WriteCreateResourceIdentifier(example, idVar, carrierResource.RequestPath, carrierResource.Type);
                var resourceVar = new CodeWriterDeclaration(carrierResource.ResourceName.ToVariableName());
                _writer.Line($"{carrierResource.Type} {resourceVar:D} = {client}.Get{carrierResource.Type.Name}({idVar});");

                return resourceVar;
            }
        }

        protected CodeWriterDeclaration WriteGetExtension(MgmtExtension parentExtension, OperationExample example, FormattableString client) => parentExtension.ArmCoreType switch
        {
            _ when parentExtension.ArmCoreType == typeof(TenantResource) => WriteGetTenantResource(parentExtension, example, client),
            _ when parentExtension.ArmCoreType == typeof(ArmResource) => WriteForArmResourceExtension(parentExtension, example, client),
            _ => WriteGetOtherExtension(parentExtension, example, client)
        };

        private CodeWriterDeclaration WriteForArmResourceExtension(MgmtTypeProvider parentExtension, OperationExample example, FormattableString client)
        {
            // For Extension against ArmResource the operation will be re-formatted to Operation(this ArmClient, ResourceIdentifier scope, ...)
            // so just return armclient here and the scope part will be handled when generate the operation invoke code

            // we should have defined the ArmClient before, try to figure it out from the formattableString instead of creating a new one
            var clientVar = client.GetArguments()?.FirstOrDefault(a => a is CodeWriterDeclaration d && d.RequestedName == "client") as CodeWriterDeclaration;
            if (clientVar == null)
                throw new InvalidOperationException("Failed to figure out ArmClient Var for calling ArmResource Extension method");
            return clientVar;
        }

        private CodeWriterDeclaration WriteGetTenantResource(MgmtTypeProvider parentExtension, OperationExample example, FormattableString client)
        {
            var resourceVar = new CodeWriterDeclaration(parentExtension.ResourceName.ToVariableName());
            _writer.Line($"var {resourceVar:D} = {client}.GetTenants().GetAllAsync().GetAsyncEnumerator().Current;");
            // since right after we get the resource above, we would immeditately call an extension method on the resource
            // here we just add the namespace of the extension class into the writer so that the following invocation would not have compilation errors
            _writer.UseNamespace(parentExtension.Namespace);
            return resourceVar;
        }

        private CodeWriterDeclaration WriteGetOtherExtension(MgmtExtension parentExtension, OperationExample example, FormattableString client)
        {
            var resourceVar = new CodeWriterDeclaration(parentExtension.ResourceName.ToVariableName());
            var idVar = new CodeWriterDeclaration($"{parentExtension.ArmCoreType.Name}Id".ToVariableName());
            WriteCreateResourceIdentifier(example, idVar, parentExtension.ContextualPath, parentExtension.ArmCoreType);

            _writer.Line($"{parentExtension.ArmCoreType} {resourceVar:D} = {client}.Get{parentExtension.ArmCoreType.Name}({idVar});");
            // since right after we get the resource above, we would immeditately call an extension method on the resource
            // here we just add the namespace of the extension class into the writer so that the following invocation would not have compilation errors
            _writer.UseNamespace(parentExtension.Namespace);
            return resourceVar;
        }

        public override string ToString()
        {
            return _writer.ToString();
        }

        protected string CreateMethodName(string methodName, bool async = true)
        {
            return async ? $"{methodName}Async" : methodName;
        }
    }
}
