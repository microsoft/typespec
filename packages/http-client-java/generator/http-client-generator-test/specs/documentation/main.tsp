import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@scenarioService("/documentation")
@doc("Illustrates documentation generation and formatting features")
namespace Documentation;

@route("/lists")
namespace Lists {
  /**
   * This tests:
   * - Simple bullet point. This bullet point is going to be very long to test how text wrapping is handled in bullet points within documentation comments. It should properly indent the wrapped lines.
   * - Another bullet point with **bold text**. This bullet point is also intentionally long to see how the formatting is preserved when the text wraps onto multiple lines in the generated documentation.
   * - Third bullet point with *italic text*. Similar to the previous points, this one is extended to ensure that the wrapping and formatting are correctly applied in the output.
   * - Complex bullet point with **bold** and *italic* combined. This bullet point combines both bold and italic formatting and is long enough to test the wrapping behavior in such cases.
   * - **Bold bullet point**: A bullet point that is entirely bolded. This point is also made lengthy to observe how the bold formatting is maintained across wrapped lines.
   * - *Italic bullet point*: A bullet point that is entirely italicized. This final point is extended to verify that italic formatting is correctly applied even when the text spans multiple lines.
   */
  @scenario
  @scenarioDoc("""
    Test simple bullet points in documentation.
    Expected behavior: Should render properly formatted bullet lists.
    """)
  @get
  @route("/bullet-points/op")
  op bulletPointsOp(): NoContentResponse;

  /**
   * This tests:
   * - Simple bullet point. This bullet point is going to be very long to test how text wrapping is handled in bullet points within documentation comments. It should properly indent the wrapped lines.
   * - Another bullet point with **bold text**. This bullet point is also intentionally long to see how the formatting is preserved when the text wraps onto multiple lines in the generated documentation.
   * - Third bullet point with *italic text*. Similar to the previous points, this one is extended to ensure that the wrapping and formatting are correctly applied in the output.
   * - Complex bullet point with **bold** and *italic* combined. This bullet point combines both bold and italic formatting and is long enough to test the wrapping behavior in such cases.
   * - **Bold bullet point**: A bullet point that is entirely bolded. This point is also made lengthy to observe how the bold formatting is maintained across wrapped lines.
   * - *Italic bullet point*: A bullet point that is entirely italicized. This final point is extended to verify that italic formatting is correctly applied even when the text spans multiple lines.
   */
  model BulletPointsModel {
    /**
     * This property uses an enum with bullet point documentation. The enum documentation includes various formatting styles to test rendering. The styles are:
     * - Simple bullet point. This bullet point is going to be very long to test how text wrapping is handled in bullet points within documentation comments. It should properly indent the wrapped lines.
     * - Bullet point with **bold text**. This bullet point is also intentionally long to see how the formatting is preserved when the text wraps onto multiple
     * - Bullet point with *italic text*. Similar to the previous points, this one is extended to ensure that the wrapping and formatting are correctly applied in the output.
     * - Complex bullet point with **bold** and *italic* combined. This bullet point combines both bold and italic formatting and is long enough to test the wrapping behavior in such cases.
     * - **Bold bullet point**
     * - *Italic bullet point*
     */
    prop: BulletPointsEnum;
  }

  /**
   * This tests really long bullet points in enum documentation to see how wrapping and formatting are handled. This should wrap around correctly and maintain proper indentation for each line.
   * - Simple bullet point. This bullet point is going to be very long to test how text wrapping is handled in bullet points within documentation comments. It should properly indent the wrapped lines.
   * - Another bullet point with **bold text**. This bullet point is also intentionally long to see how the formatting is preserved when the text wraps onto multiple lines in the generated documentation.
   * - Third bullet point with *italic text*. Similar to the previous points, this one is extended to ensure that the wrapping and formatting are correctly applied in the output.
   * - Complex bullet point with **bold** and *italic* combined. This bullet point combines both bold and italic formatting and is long enough to test the wrapping behavior in such cases.
   * - **Bold bullet point**: A bullet point that is entirely bolded. This point is also made lengthy to observe how the bold formatting is maintained across wrapped lines.
   * - *Italic bullet point*: A bullet point that is entirely italicized. This final point is extended to verify that italic formatting is correctly applied even when the text spans multiple lines.
   */
  enum BulletPointsEnum {
    /**
     * Simple bullet point. This line is intentionally long to test text wrapping in bullet points within enum documentation comments. It should properly indent the wrapped lines.
     * - One: one. This line is intentionally long to test text wrapping in bullet points within enum documentation comments. It should properly indent the wrapped lines.
     * - Two: two. This line is intentionally long to test text wrapping in bullet points within enum documentation comments. It should properly indent the wrapped lines.
     */
    Simple: "Simple",

    /**
     * Bullet point with **bold text**. This line is intentionally long to test text wrapping in bullet points within enum documentation comments. It should properly indent the wrapped lines.
     * - **One**: one. This line is intentionally long to test text wrapping in bullet points within enum documentation comments. It should properly indent the wrapped lines.
     * - **Two**: two. This line is intentionally long to test text wrapping in bullet points within enum documentation comments. It should properly indent the wrapped lines.
     */
    Bold: "Bold",

    /**
     * Bullet point with *italic text*. This line is intentionally long to test text wrapping in bullet points within enum documentation comments. It should properly indent the wrapped lines.
     * - *One*: one. This line is intentionally long to test text wrapping in bullet points within enum documentation comments. It should properly indent the wrapped lines.
     * - *Two*: two. This line is intentionally long to test text wrapping in bullet points within enum documentation comments. It should properly indent the wrapped lines.
     */
    Italic: "Italic",
  }

  @scenarioDoc("""
    Test bullet points in model and enum documentation.
    Expected input:
    ```json
    {
      "prop": "Simple"
    }
    ```
    """)
  @post
  @route("/bullet-points/model")
  op bulletPointsModel(input: BulletPointsModel): NoContentResponse;

  /**
   * Steps to follow:
   * 1. First step with **important** note
   * 2. Second step with *emphasis*
   * 3. Third step combining **bold** and *italic*
   * 4. **Final step**: Review all steps for *accuracy*.
   */
  @scenario
  @scenarioDoc("""
    Test numbered lists.
    Expected behavior: Should render numbered list properly.
    """)
  @route("/numbered")
  @get
  op numbered(): NoContentResponse;
}

@route("/text-formatting")
namespace TextFormatting {
  /**
   * This is **bold text** in the middle of a sentence.
   * This is a sentence with **multiple bold** sections and **another bold** section.
   * **This entire sentence is bold.**
   */
  @scenario
  @scenarioDoc("""
    Expected behavior: Text between ** should render as bold.
    """)
  @route("/bold")
  @get
  op boldText(): NoContentResponse;

  /**
   * This is *italic text* in the middle of a sentence.
   * This is a sentence with *multiple italic* sections and *another italic* section.
   * *This entire sentence is italic.*
   * */
  @scenario
  @scenarioDoc("""
    Test italic text formatting using *single asterisks*.
    Expected behavior: Text between * should render as italic.
    """)
  @route("/italic")
  @get
  op italicText(): NoContentResponse;

  /**
   * This sentence has **bold**, *italic*, and ***bold italic*** text.
   * You can also combine them like **bold with *italic inside* bold**.
   * Or *italic with **bold inside** italic*.
   * This is a sentence with **bold**, *italic*, and ***bold italic*** text.
   */
  @scenario
  @scenarioDoc("""
    Test combined bold and italic formatting.
    Expected behavior: Should handle nested and combined formatting.
    """)
  @route("/combined")
  @get
  op combinedFormatting(): NoContentResponse;
}
