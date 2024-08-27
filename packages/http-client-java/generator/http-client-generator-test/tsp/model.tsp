import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;

@service({
  title: "Model",
})
namespace Cadl.Model;

// input-output
model Resource1 {
  name: string;

  @visibility("read")
  outputData: OutputData;

  @visibility("read")
  outputData2: InputOutputData2;
}

// input-output
model Resource2 {
  name: string;
  data2: InputOutputData2;
}

// output
model Resource3 {
  name: string;
  outputData3: OutputData3;
}

// output
model OutputData {
  data: string;
}

// input-output, due to Resource2
model InputOutputData2 {
  data: string;
}

// output
model OutputData3 {
  data: string;
}

// root model
model NestedModel {
  nested1: NestedModel1;
}

// nested level1
model NestedModel1 {
  nested2: NestedModel2;
}

// nested level2
model NestedModel2 {
  data: string;
}

@route("/model")
interface ModelOp {
  @put
  @route("/resource1")
  put1(@body body: Resource1): Resource1;

  @put
  @route("/resource2")
  put2(@body body: Resource2): Resource2;

  @get
  @route("/resource3")
  get3(): Resource3;

  @get
  @route("/nested")
  putNested(@body body: NestedModel): NestedModel;
}
