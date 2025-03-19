import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service({
  title: "Visibility",
})
namespace TspTest.Visibility;

model Dog {
  @visibility(Lifecycle.Read) id: int32;
  @visibility(Lifecycle.Create, Lifecycle.Update) secretName: string;

  // no flags are same as specifying all Lifecycle
  name: string;
}

model RoundTripModel {
  name: string;
  @visibility(Lifecycle.Create, Lifecycle.Update) secretName: string;
}

// The spread operator will copy all the properties of Dog into ReadDog,
// and withVisibility will remove any that don't match the current
// visibility setting
@withVisibility(Lifecycle.Read)
model ReadDog {
  ...Dog;
}

@withVisibility(Lifecycle.Create, Lifecycle.Update)
model WriteDog {
  ...Dog;
}

@operationGroup
interface VisibilityRead {
  @get
  @route("/read")
  get(): {
    @body body: Dog;
  };
}

@operationGroup
interface VisibilityWrite {
  @put
  @route("/write")
  create(@body dog: WriteDog): {
    @body body: Dog;
  };
}

@route("/visibility")
interface VisibilityOp extends VisibilityRead, VisibilityWrite {
  @post
  @route("/query")
  query(@body dog: WriteDog): {
    @body body: ReadDog;
  };

  @put
  @route("/roundtrip")
  roundtrip(@body body: RoundTripModel): {
    @body body: RoundTripModel;
  };
}
