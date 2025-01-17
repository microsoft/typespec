import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";


using TypeSpec.Http;
using Azure.ClientGenerator.Core;


@service
namespace MyService {
  model Test {
    prop: string;
  }
  @scope("!csharp")
  op func(
    @body body: Test
  ): void;
}
