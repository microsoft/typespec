using Microsoft.TypeSpec.Generator.Customizations;

// CodeGenNamespace targets a type that does not exist in the input
[assembly: CodeGenNamespace("NonExistentType", "SomeOther.Namespace")]
