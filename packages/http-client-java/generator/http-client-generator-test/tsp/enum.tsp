import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.Core;
using Azure.ClientGenerator.Core;

@service({
  title: "EnumService",
})
namespace Cadl.EnumService;

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "For testing"
enum Color {
  Red,
  Blue,
  Green,
}

union ColorModel {
  ColorModelBase,
  Blue: "Blue",
  Green: "Green",
}

union ColorModelBase {
  string,
  Red: "Red",
}

@access(Access.public)
@usage(Usage.input | Usage.output)
union PriorityModel {
  int32,
  High: 100,
  Low: 0,
}

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "For testing"
enum Priority {
  High: 100,
  Low: 0,
}

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "For testing"
enum Unit {
  Grams: 1,
  KiloGrams: 0.001,
  Milligram: 1000,
}

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "For testing"
enum OperationStateValues {
  Running,
  Completed,
  Failed,
}

@usage(Usage.input)
model Operation {
  name: "Read" | "Write";
  best: true;
  age: 50;
  priority: Priority;
  color: ColorModel;
  unit: Unit;
  priorityValue: Priority.Low;
  colorValue: Color.Green;
  colorModelValue: ColorModel.Blue;
  unitValue?: Unit.Milligram;
}

@client({
  service: Cadl.EnumService,
  name: "EnumServiceClient",
})
@route("/enum")
interface EnumOp {
  @get
  @route("/color")
  getColor(): Color;

  @get
  @route("/colormodel")
  getColorModel(): {
    @body body: ColorModel;
  };

  @post
  @route("operation/colormodel")
  setColorModel(@query color: ColorModel): Operation;

  @post
  @route("operation/priority")
  setPriority(@query priority: Priority): Operation;

  @get
  @route("operation/state/running")
  getRunningOperation(@query state: "Running"): Operation;

  @get
  @route("operation/state")
  getOperation(@query state: OperationStateValues): Operation;

  @post
  @route("operation/stringenumarray")
  setStringEnumArray(
    @query
    colorArray: ColorModel[],

    @query
    colorArrayOpt?: ColorModel[],
  ): string;

  @post
  @route("operation/intenumarray")
  setIntEnumArray(
    @query
    @encode("ssv")
    priorityArray: Priority[],

    @query
    priorityArrayOpt?: Priority[],
  ): string;

  @post
  @route("operation/stringarray")
  setStringArray(
    @query
    stringArray: string[],

    @query
    stringArrayOpt?: string[],
  ): string;

  @post
  @route("operation/intarray")
  setIntArray(
    @query
    intArray: int32[],

    @query
    intArrayOpt?: int32[],
  ): string;

  @post
  @route("operation/stringenummulti")
  setStringEnumMulti(
    @query(#{ explode: true })
    colorArray: ColorModel[],

    @query(#{ explode: true })
    colorArrayOpt?: ColorModel[],
  ): string;

  @post
  @route("operation/intenummulti")
  setIntEnumMulti(
    @query(#{ explode: true })
    priorityArray: Priority[],

    @query(#{ explode: true })
    priorityArrayOpt?: Priority[],
  ): string;

  @post
  @route("operation/stringmulti")
  setStringMulti(
    @query(#{ explode: true })
    stringArray: string[],

    @query(#{ explode: true })
    stringArrayOpt?: string[],
  ): string;

  @post
  @route("operation/intmulti")
  setIntMulti(
    @query(#{ explode: true })
    intArray: int32[],

    @query(#{ explode: true })
    intArrayOpt?: int32[],
  ): string;

  @post
  @route("operation/stringenumarrayheader")
  setStringEnumArrayHeader(
    @header({
      format: "csv",
    })
    colorArray: ColorModel[],

    @header({
      format: "csv",
    })
    colorArrayOpt?: ColorModel[],
  ): string;
}
