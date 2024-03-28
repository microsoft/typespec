namespace OpenAI;
using TypeSpec.OpenAPI;

model CreateModerationRequest {
  /** The input text to classify */
  input: string | string[];

  /**
   * Two content moderations models are available: `text-moderation-stable` and
   * `text-moderation-latest`. The default is `text-moderation-latest` which will be automatically
   * upgraded over time. This ensures you are always using our most accurate model. If you use
   * `text-moderation-stable`, we will provide advanced notice before updating the model. Accuracy
   * of `text-moderation-stable` may be slightly lower than for `text-moderation-latest`.
   */
  @extension("x-oaiTypeLabel", "string")
  `model`?: string | "text-moderation-latest" | "text-moderation-stable" = "text-moderation-latest";
}

model CreateModerationResponse {
  /** The unique identifier for the moderation request. */
  id: string;

  /** The model used to generate the moderation results. */
  `model`: string;

  /** A list of moderation objects. */
  results: {
    /** Whether the content violates [OpenAI's usage policies](/policies/usage-policies). */
    flagged: boolean;

    /** A list of the categories, and whether they are flagged or not. */
    categories: {
      /**
       * Content that expresses, incites, or promotes hate based on race, gender, ethnicity,
       * religion, nationality, sexual orientation, disability status, or caste. Hateful content
       * aimed at non-protected groups (e.g., chess players) is harrassment.
       */
      hate: boolean;

      /**
       * Hateful content that also includes violence or serious harm towards the targeted group
       * based on race, gender, ethnicity, religion, nationality, sexual orientation, disability
       * status, or caste.
       */
      `hate/threatening`: boolean;

      /** Content that expresses, incites, or promotes harassing language towards any target. */
      harassment: boolean;

      /** Harassment content that also includes violence or serious harm towards any target. */
      `harassment/threatening`: boolean;

      /**
       * Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting,
       * and eating disorders.
       */
      `self-harm`: boolean;

      /**
       * Content where the speaker expresses that they are engaging or intend to engage in acts of
       * self-harm, such as suicide, cutting, and eating disorders.
       */
      `self-harm/intent`: boolean;

      /**
       * Content that encourages performing acts of self-harm, such as suicide, cutting, and eating
       * disorders, or that gives instructions or advice on how to commit such acts.
       */
      `self-harm/instructive`: boolean;

      /**
       * Content meant to arouse sexual excitement, such as the description of sexual activity, or
       * that promotes sexual services (excluding sex education and wellness).
       */
      sexual: boolean;

      /** Sexual content that includes an individual who is under 18 years old. */
      `sexual/minors`: boolean;

      /** Content that depicts death, violence, or physical injury. */
      violence: boolean;

      /** Content that depicts death, violence, or physical injury in graphic detail. */
      `violence/graphic`: boolean;
    };

    /** A list of the categories along with their scores as predicted by model. */
    category_scores: {
      /** The score for the category 'hate'. */
      hate: float64;

      /** The score for the category 'hate/threatening'. */
      `hate/threatening`: float64;

      /** The score for the category 'harassment'. */
      harassment: float64;

      /** The score for the category 'harassment/threatening'. */
      `harassment/threatening`: float64;

      /** The score for the category 'self-harm'. */
      `self-harm`: float64;

      /** The score for the category 'self-harm/intent'. */
      `self-harm/intent`: float64;

      /** The score for the category 'self-harm/instructive'. */
      `self-harm/instructive`: float64;

      /** The score for the category 'sexual'. */
      sexual: float64;

      /** The score for the category 'sexual/minors'. */
      `sexual/minors`: float64;

      /** The score for the category 'violence'. */
      violence: float64;

      /** The score for the category 'violence/graphic'. */
      `violence/graphic`: float64;
    };
  }[];
}
