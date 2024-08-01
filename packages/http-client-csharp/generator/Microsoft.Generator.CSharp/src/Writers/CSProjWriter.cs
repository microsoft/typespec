// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Reflection;
using System.Text;
using System.Xml;

namespace Microsoft.Generator.CSharp;

internal class CSProjWriter
{
    public CSProjWriter()
    {
        ProjectReferences = new List<CSProjDependencyPackage>();
        PackageReferences = new List<CSProjDependencyPackage>();
        PrivatePackageReferences = new List<CSProjDependencyPackage>();
        CompileIncludes = new List<CSProjCompileInclude>();
    }

    public CSProjProperty? Description { get; init; }

    public CSProjProperty? AssemblyTitle { get; init; }

    public CSProjProperty? Version { get; init; }

    public CSProjProperty? PackageTags { get; init; }

    public CSProjProperty? TargetFrameworks { get; init; }

    public CSProjProperty? TargetFramework { get; init; }

    public CSProjProperty? IncludeOperationsSharedSource { get; init; }

    public CSProjProperty? LangVersion { get; init; }

    public CSProjProperty? GenerateDocumentationFile { get; init; }

    public CSProjProperty? NoWarn { get; init; }

    public CSProjProperty? TreatWarningsAsErrors { get; init; }

    public CSProjProperty? Nullable { get; init; }

    public CSProjProperty? IncludeManagementSharedCode { get; init; }

    public CSProjProperty? IncludeGeneratorSharedCode { get; init; }

    public CSProjProperty? DefineConstants { get; init; }

    public CSProjProperty? RestoreAdditionalProjectSources { get; init; }

    public IList<CSProjDependencyPackage> ProjectReferences { get; }

    public IList<CSProjDependencyPackage> PackageReferences { get; }

    public IList<CSProjDependencyPackage> PrivatePackageReferences { get; }

    public IList<CSProjCompileInclude> CompileIncludes { get; }

    public string Write()
    {
        var builder = new StringBuilder();
        using var writer = XmlWriter.Create(builder, new XmlWriterSettings
        {
            OmitXmlDeclaration = true,
            Indent = true
        });
        writer.WriteStartDocument();
        // write the Project element
        writer.WriteStartElement("Project");
        writer.WriteAttributeString("Sdk", "Microsoft.NET.Sdk");
        // write properties
        WriteProperties(writer);

        // write the first ItemGroup for compile include
        if (CompileIncludes.Count > 0)
        {
            // this is the only way I know to write a blank line in an xml document using APIs instead of just write raw strings
            // feel free to change this if other elegant way is found.
            writer.Flush();
            builder.AppendLine();
            writer.WriteStartElement("ItemGroup");
            foreach (var compileInclude in CompileIncludes)
            {
                WriteCompileInclude(writer, compileInclude);
            }
            writer.WriteEndElement();
        }

        // write project references
        if (ProjectReferences.Count > 0)
        {
            writer.Flush();
            builder.AppendLine();
            writer.WriteStartElement("ItemGroup");
            foreach (var package in ProjectReferences)
            {
                WriteProjectReference(writer, package);
            }
            writer.WriteEndElement();
        }

        // write package references
        if (PackageReferences.Count > 0)
        {
            writer.Flush();
            builder.AppendLine();
            writer.WriteStartElement("ItemGroup");
            foreach (var package in PackageReferences)
            {
                WritePackageReference(writer, package);
            }
            writer.WriteEndElement();
        }

        // write private package references
        if (PrivatePackageReferences.Count > 0)
        {
            writer.Flush();
            builder.AppendLine();
            writer.WriteStartElement("ItemGroup");
            foreach (var package in PrivatePackageReferences)
            {
                WritePackageReference(writer, package, true);
            }
            writer.WriteEndElement();
        }

        writer.WriteEndDocument();
        writer.Close();
        writer.Flush();

        // add an empty on the end of file
        builder.AppendLine();

        return builder.ToString();
    }

    private static readonly IEnumerable<PropertyInfo> _properties = typeof(CSProjWriter).GetProperties(BindingFlags.Public | BindingFlags.Instance);

    private void WriteProperties(XmlWriter writer)
    {
        writer.WriteStartElement("PropertyGroup");
        // this will write those properties in the same order as they are defined in this class
        // introduce this method to save the effort of writing every property one by one
        foreach (var property in _properties)
        {
            // only include those CSProjProperty types
            if (property.PropertyType != typeof(CSProjProperty))
                continue;
            // invoke the WriteElementIfNotNull method on each of them
            var value = (CSProjProperty?)property.GetValue(this);
            WriteElementIfNotNull(writer, property.Name, value);
        }
        writer.WriteEndElement();
    }

    private void WriteElementIfNotNull(XmlWriter writer, string name, CSProjProperty? property)
    {
        if (property == null)
            return;

        if (property.Comment != null)
        {
            writer.WriteComment(property.Comment);
        }

        writer.WriteElementString(name, property.Value);
    }

    private void WriteCompileInclude(XmlWriter writer, CSProjCompileInclude compileInclude)
    {
        writer.WriteStartElement("Compile");
        writer.WriteAttributeString("Include", compileInclude.Include);
        if (compileInclude.LinkBase != null)
        {
            writer.WriteAttributeString("LinkBase", compileInclude.LinkBase);
        }
        writer.WriteEndElement();
    }

    private void WriteProjectReference(XmlWriter writer, CSProjDependencyPackage package)
    {
        writer.WriteStartElement("ProjectReference");
        writer.WriteAttributeString("Include", package.PackageName);
        writer.WriteEndElement();
    }

    private void WritePackageReference(XmlWriter writer, CSProjDependencyPackage package, bool isPrivateAsset = false)
    {
        writer.WriteStartElement("PackageReference");
        writer.WriteAttributeString("Include", package.PackageName);
        if (package.Version != null)
        {
            writer.WriteAttributeString("Version", package.Version);
        }
        if (isPrivateAsset)
        {
            writer.WriteAttributeString("PrivateAssets", "All");
        }
        writer.WriteEndElement();
    }

    public record CSProjProperty(string Value, string? Comment)
    {
        public CSProjProperty(string value) : this(value, null)
        { }

        public static implicit operator CSProjProperty(string value) => new(value, null);
        public static implicit operator CSProjProperty(bool value) => new(XmlConvert.ToString(value), null);
    }

    public record CSProjDependencyPackage(string PackageName, string? Version)
    {
        public CSProjDependencyPackage(string packageName) : this(packageName, null) { }
    }

    public record CSProjCompileInclude(string Include, string? LinkBase)
    {
        public CSProjCompileInclude(string include) : this(include, null) { }
    }
}
