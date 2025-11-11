import type {
  BooleanLiteral,
  DiscriminatedUnion,
  MemberType,
  Model,
  NumericLiteral,
  Scalar,
  StringLiteral,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import { getVisibilitySuffix, Visibility } from "@typespec/http";
import {
  MutationHalfEdge,
  UnionMutation,
  type MutationNodeForType,
} from "@typespec/mutator-framework";
import type {
  HttpCanonicalization,
  HttpCanonicalizationMutations,
} from "./http-canonicalization-classes.js";
import type { HttpCanonicalizationInfo, HttpCanonicalizer } from "./http-canonicalization.js";
import { ModelHttpCanonicalization } from "./model.js";
import { HttpCanonicalizationOptions } from "./options.js";
import type { UnionVariantHttpCanonicalization } from "./union-variant.jsx";

export interface VariantDescriptor {
  variant: UnionVariantHttpCanonicalization;
  envelopeType: ModelHttpCanonicalization | null;
  discriminatorValue?: string | number | boolean | null;
}

export type VariantTest = ConstVariantTest | PropertyExistenceTest | TypeVariantTest;

export interface VariantTestBase {
  kind: string;
  // the path of the type to test. An empty path means the type itself.
  path: string[];
}

export interface ConstVariantTest extends VariantTestBase {
  kind: "literal";
  value: string | number | boolean | null;
}

export interface PropertyExistenceTest extends VariantTestBase {
  kind: "propertyExistence";
  propertyName: string;
}

export interface TypeVariantTest extends VariantTestBase {
  kind: "type";
  type: "object" | "array" | "string" | "number" | "boolean";
}

type TypeCategory = TypeVariantTest["type"];

interface VariantAnalysis {
  index: number;
  variant: UnionVariantHttpCanonicalization;
  mutatedVariant: UnionVariant;
  mutatedType: Type;
  typeCategory: TypeCategory | null;
  constTests: ConstVariantTest[];
  availableTests: VariantTestDefinition[];
}

interface VariantTestDefinition {
  test: VariantTest;
  evaluate: (analysis: VariantAnalysis) => boolean;
  required: boolean;
}

/**
 * Canonicalizes union types, tracking discriminators and runtime variant tests.
 */
export class UnionHttpCanonicalization extends UnionMutation<
  HttpCanonicalizationOptions,
  HttpCanonicalizationMutations,
  HttpCanonicalizer
> {
  /**
   * Indicates if this union corresponds to a named declaration.
   */
  isDeclaration: boolean = false;

  /**
   * True when \@discriminator is present on the union.
   */
  isDiscriminated: boolean = false;
  /**
   * Envelope structure used for discriminated unions.
   */
  envelopeKind: "object" | "none" = "none";
  /**
   * Canonicalized discriminator property for envelope unions.
   */
  discriminatorProperty: ModelHttpCanonicalization | null = null;
  /**
   * Collection of descriptors describing each canonicalized variant.
   */
  variantDescriptors: VariantDescriptor[] = [];
  /**
   * Runtime tests used to select a variant for language types.
   */
  languageVariantTests: {
    tests: VariantTest[];
    variant: UnionVariantHttpCanonicalization;
  }[] = [];
  /**
   * Runtime tests used to select a variant for wire types.
   */
  wireVariantTests: {
    tests: VariantTest[];
    variant: UnionVariantHttpCanonicalization;
  }[] = [];
  /**
   * Discriminated union metadata.
   */
  #discriminatedUnionInfo: DiscriminatedUnion | null = null;
  /**
   * Name of the discriminator property when present.
   */
  discriminatorPropertyName: string | null = null;
  /**
   * Name of the envelope property when present.
   */
  envelopePropertyName: string | null = null;

  #languageMutationNode: MutationNodeForType<Union>;
  #wireMutationNode: MutationNodeForType<Union>;

  /**
   * The language mutation node for this union.
   */
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  /**
   * The wire mutation node for this union.
   */
  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  /**
   * The potentially mutated language type for this union.
   */
  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  /**
   * The potentially mutated wire type for this union.
   */
  get wireType() {
    return this.#wireMutationNode.mutatedType;
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: Union,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Unions don't need a codec
    };
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: Union,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    info: HttpCanonicalizationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#languageMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-language",
    );
    this.#wireMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-wire",
    );

    this.options = options;
    this.isDeclaration = !!this.sourceType.name;
    this.#discriminatedUnionInfo = this.engine.$.union.getDiscriminatedUnion(sourceType) ?? null;
    this.isDiscriminated = !!this.#discriminatedUnionInfo;
    this.envelopePropertyName = this.#discriminatedUnionInfo?.options.envelopePropertyName ?? null;
    this.discriminatorPropertyName =
      this.#discriminatedUnionInfo?.options.discriminatorPropertyName ?? null;
  }

  protected startVariantEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
      this.#languageMutationNode.connectVariant(tail.languageMutationNode);
      this.#wireMutationNode.connectVariant(tail.wireMutationNode);
    });
  }

  /**
   * Returns variants that remain visible under the current visibility rules.
   */
  get visibleVariants(): Map<string, UnionVariantHttpCanonicalization> {
    return new Map(
      [...(this.variants as Map<string, UnionVariantHttpCanonicalization>)].filter(
        ([_, p]) => (p as UnionVariantHttpCanonicalization).isVisible,
      ),
    );
  }

  /**
   * Canonicalize this union for HTTP.
   */
  mutate() {
    this.#languageMutationNode.whenMutated(this.#renameWhenMutated.bind(this));
    this.#wireMutationNode.whenMutated(this.#renameWhenMutated.bind(this));

    super.mutate();

    if (this.isDiscriminated) {
      const envelopeProp = this.#discriminatedUnionInfo!.options.envelopePropertyName;
      const discriminatorProp = this.#discriminatedUnionInfo!.options.discriminatorPropertyName;

      for (const [variantName, variant] of this.variants) {
        if (typeof variantName !== "string") {
          throw new Error("symbolic variant names are not supported");
        }

        const canonicalizedVariant = variant as UnionVariantHttpCanonicalization;
        const descriptor: VariantDescriptor = {
          variant: canonicalizedVariant,
          envelopeType: this.engine.canonicalize(
            this.engine.$.model.create({
              name: "",
              properties: {
                [discriminatorProp]: this.engine.$.modelProperty.create({
                  name: discriminatorProp,
                  type: this.engine.$.literal.create(variantName),
                }),
                [envelopeProp]: this.engine.$.modelProperty.create({
                  name: envelopeProp,
                  type: canonicalizedVariant.languageType.type,
                }),
              },
            }),
            this.options,
          ) as unknown as ModelHttpCanonicalization,
          discriminatorValue: variantName,
        };

        this.variantDescriptors.push(descriptor);
      }
    } else {
      this.#detectVariantTests();
    }
  }

  /**
   * Appends visibility-specific suffixes to mutated union names.
   */
  #renameWhenMutated(mutated: Union | null) {
    if (!mutated) {
      return;
    }

    const suffix = getVisibilitySuffix(this.options.visibility, Visibility.Read);

    mutated.name = `${mutated.name}${suffix}`;
  }

  /**
   * Computes runtime test suites for non-discriminated unions.
   */
  #detectVariantTests() {
    const variants = [...this.visibleVariants.values()];

    if (variants.length === 0) {
      this.languageVariantTests = [];
      this.wireVariantTests = [];
      return;
    }

    this.languageVariantTests = this.#computeVariantTests(variants, "language");
    this.wireVariantTests = this.#computeVariantTests(variants, "wire");
  }

  /**
   * Produces ordered variant test plans for the specified output target.
   */
  #computeVariantTests(variants: UnionVariantHttpCanonicalization[], target: "language" | "wire") {
    const analyses = variants.map((variant, index) => this.#analyzeVariant(variant, target, index));

    for (const analysis of analyses) {
      analysis.availableTests = this.#buildTestDefinitions(analysis, analyses);
    }

    const orderedAnalyses = [...analyses].sort((a, b) => {
      const priorityDiff = this.#variantPriority(a) - this.#variantPriority(b);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return a.index - b.index;
    });

    return orderedAnalyses.map((analysis) => {
      const selected = this.#selectTestsForVariant(analysis, analyses);
      const tests = selected
        .slice()
        .sort((a, b) => this.#testPriority(a.test) - this.#testPriority(b.test))
        .map((definition) => definition.test);

      return { variant: analysis.variant, tests };
    });
  }

  /**
   * Inspects a variant to gather metadata needed for test selection.
   */
  #analyzeVariant(
    variant: UnionVariantHttpCanonicalization,
    target: "language" | "wire",
    index: number,
  ): VariantAnalysis {
    const mutatedVariant = target === "language" ? variant.languageType : variant.wireType;
    const mutatedType = mutatedVariant.type;
    const typeCategory = this.#getTypeCategory(mutatedType);
    const constTests = this.#collectConstVariantTests(variant, mutatedVariant, target);

    return {
      index,
      variant,
      mutatedVariant,
      mutatedType,
      typeCategory,
      constTests,
      availableTests: [],
    };
  }

  /**
   * Generates candidate tests for differentiating the provided variant.
   */
  #buildTestDefinitions(
    analysis: VariantAnalysis,
    analyses: VariantAnalysis[],
  ): VariantTestDefinition[] {
    const definitions: VariantTestDefinition[] = [];

    if (analysis.typeCategory) {
      const required = this.#isTypeTestRequired(analysis, analyses);
      const typeTest: TypeVariantTest = {
        kind: "type",
        path: [],
        type: analysis.typeCategory,
      };
      definitions.push({
        test: typeTest,
        evaluate: (candidate) => candidate.typeCategory === analysis.typeCategory,
        required,
      });
    }

    for (const constTest of analysis.constTests) {
      definitions.push({
        test: constTest,
        evaluate: (candidate) => this.#passesConstTest(constTest, candidate),
        required: false,
      });
    }

    return definitions;
  }

  /**
   * Chooses the minimal set of tests that uniquely identify a variant.
   */
  #selectTestsForVariant(
    analysis: VariantAnalysis,
    analyses: VariantAnalysis[],
  ): VariantTestDefinition[] {
    const others = analyses.filter((candidate) => candidate !== analysis);

    if (analysis.availableTests.length === 0) {
      if (others.length === 0) {
        return [];
      }

      throw new Error(
        `Unable to determine distinguishing runtime checks for union variant "${this.#getVariantDebugName(analysis.variant)}".`,
      );
    }

    const required = analysis.availableTests.filter((test) => test.required);
    const optional = analysis.availableTests.filter((test) => !test.required);

    const remaining = others.filter((candidate) =>
      required.every((test) => test.evaluate(candidate)),
    );

    if (remaining.length === 0) {
      return required;
    }

    const optionalSubset = this.#findCoveringSubset(optional, remaining);

    if (!optionalSubset) {
      throw new Error(
        `Unable to distinguish union variant "${this.#getVariantDebugName(analysis.variant)}" with available runtime checks.`,
      );
    }

    return [...required, ...optionalSubset];
  }

  /**
   * Finds a set of optional tests that differentiate the provided candidates.
   */
  #findCoveringSubset(
    tests: VariantTestDefinition[],
    candidates: VariantAnalysis[],
  ): VariantTestDefinition[] | null {
    if (tests.length === 0) {
      return null;
    }

    for (let size = 1; size <= tests.length; size++) {
      const subset = this.#findCoveringSubsetOfSize(tests, candidates, size, 0, []);
      if (subset) {
        return subset;
      }
    }

    return null;
  }

  /**
   * Searches for a covering subset of tests of the requested size.
   */
  #findCoveringSubsetOfSize(
    tests: VariantTestDefinition[],
    candidates: VariantAnalysis[],
    size: number,
    start: number,
    working: VariantTestDefinition[],
  ): VariantTestDefinition[] | null {
    if (working.length === size) {
      const coversAll = candidates.every((candidate) =>
        working.some((test) => !test.evaluate(candidate)),
      );

      return coversAll ? [...working] : null;
    }

    for (let index = start; index <= tests.length - (size - working.length); index++) {
      working.push(tests[index]!);
      const result = this.#findCoveringSubsetOfSize(tests, candidates, size, index + 1, working);
      if (result) {
        return result;
      }
      working.pop();
    }

    return null;
  }

  /**
   * Determines if a type-test is required to distinguish a variant.
   */
  #isTypeTestRequired(analysis: VariantAnalysis, analyses: VariantAnalysis[]) {
    if (analysis.typeCategory === "object") {
      return analyses.some(
        (candidate) => candidate !== analysis && candidate.typeCategory !== "object",
      );
    }

    if (analysis.typeCategory === "array") {
      return analyses.some(
        (candidate) => candidate !== analysis && candidate.typeCategory !== "array",
      );
    }

    return false;
  }

  /**
   * Collects literal-based tests for the provided variant.
   */
  #collectConstVariantTests(
    variant: UnionVariantHttpCanonicalization,
    mutatedVariant: UnionVariant,
    target: "language" | "wire",
  ) {
    const tests: ConstVariantTest[] = [];

    const literalValue = this.#getLiteralValueFromType(mutatedVariant.type);
    if (literalValue !== undefined) {
      tests.push({ kind: "literal", path: [], value: literalValue });
    }

    if (variant.type instanceof ModelHttpCanonicalization) {
      tests.push(...this.#collectModelConstTests(variant.type, target));
    }

    return tests;
  }

  /**
   * Gathers literal tests from a variant's model properties.
   */
  #collectModelConstTests(
    model: ModelHttpCanonicalization,
    target: "language" | "wire",
  ): ConstVariantTest[] {
    const tests: ConstVariantTest[] = [];

    for (const property of model.visibleProperties.values()) {
      if (property.sourceType.optional) {
        continue;
      }

      const propertyName =
        target === "language" ? property.languageType?.name : property.wireType?.name;

      if (!propertyName) {
        continue;
      }

      const propertyType =
        target === "language"
          ? (property.type as HttpCanonicalization).languageType
          : (property.type as HttpCanonicalization).wireType;
      const literalValue = this.#getLiteralValueFromType(propertyType);
      if (literalValue === undefined) {
        continue;
      }

      tests.push({
        kind: "literal",
        path: [propertyName],
        value: literalValue,
      });
    }

    return tests;
  }

  /**
   * Evaluates whether a candidate analysis satisfies a literal test.
   */
  #passesConstTest(test: ConstVariantTest, analysis: VariantAnalysis) {
    if (test.path.length === 0) {
      const literalValue = this.#getLiteralValueFromType(analysis.mutatedType);
      return literalValue !== undefined && literalValue === test.value;
    }

    let currentType: Type | undefined = analysis.mutatedType;

    for (const segment of test.path) {
      if (!currentType || currentType.kind !== "Model") {
        return false;
      }

      const property = this.#getModelProperty(currentType, segment);
      if (!property) {
        return false;
      }

      currentType = property.type;
    }

    const literalValue = this.#getLiteralValueFromType(currentType);
    return literalValue !== undefined && literalValue === test.value;
  }

  /**
   * Extracts a literal value from a TypeSpec type when possible.
   */
  #getLiteralValueFromType(type: Type | undefined) {
    if (!type) {
      return undefined;
    }

    switch (type.kind) {
      case "String":
      case "Number":
      case "Boolean":
        return (type as StringLiteral | NumericLiteral | BooleanLiteral).value;
      case "Intrinsic":
        if (type.name === "null") {
          return null;
        }
      // eslint-disable-next-line no-fallthrough
      default:
        return undefined;
    }
  }

  /**
   * Retrieves a model property by name from a TypeSpec model.
   */
  #getModelProperty(model: Model, name: string) {
    return model.properties.get(name);
  }

  /**
   * Maps a TypeSpec type to the coarse category used by runtime tests.
   */
  #getTypeCategory(type: Type): TypeCategory | null {
    if (this.engine.$.array.is(type)) {
      return "array";
    }

    switch (type.kind) {
      case "Model":
        return "object";
      case "String":
        return "string";
      case "Number":
        return "number";
      case "Boolean":
        return "boolean";
      case "Scalar":
        return this.#mapScalarRootToCategory(type);
      default:
        return null;
    }
  }

  /**
   * Maps a scalar's root type to the corresponding runtime category.
   */
  #mapScalarRootToCategory(scalar: Scalar | null): TypeCategory | null {
    if (!scalar) {
      return null;
    }
    const $ = this.engine.$;

    if ($.scalar.extendsString(scalar)) {
      return "string";
    } else if ($.scalar.extendsNumeric(scalar)) {
      return "number";
    } else if ($.scalar.extendsBoolean(scalar)) {
      return "boolean";
    }

    return null;
  }

  /**
   * Provides a deterministic priority used to order variants.
   */
  #variantPriority(analysis: VariantAnalysis) {
    switch (analysis.typeCategory) {
      case "number":
        return 0;
      case "boolean":
        return 1;
      case "string":
        return 2;
      case "array":
        return 3;
      case "object":
        return 4;
      default:
        return 5;
    }
  }

  /**
   * Provides a deterministic priority used to order variant tests.
   */
  #testPriority(test: VariantTest) {
    switch (test.kind) {
      case "type":
        return 0;
      case "literal":
        return 1;
      case "propertyExistence":
        return 2;
      default:
        return 10;
    }
  }

  /**
   * Formats a variant name for debugging and error messages.
   */
  #getVariantDebugName(variant: UnionVariantHttpCanonicalization) {
    const name = variant.sourceType.name;
    if (typeof name === "string") {
      return name;
    }
    if (typeof name === "symbol") {
      return name.toString();
    }

    const kind = variant.sourceType.type?.kind;
    return kind ? `${kind} variant` : "anonymous variant";
  }
}
