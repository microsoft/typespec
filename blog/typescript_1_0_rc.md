Skip to main content
Microsoft
Dev Blogs
Developer Technology More

Theme
Sign in

Dev Blogs
TypeScript
Announcing TypeScript 1.0RC
February 25th, 2014
Announcing TypeScript 1.0RC
Jonathan Turner [MS]
Jonathan Turner [MS]

Table of contents
We’re happy to mark another significant milestone for the TypeScript project with the release of the 1.0 Release Candidate. Since the first release in October of 2012, the TypeScript language has grown to support generics, which enables rich typing of JavaScript libraries. Last December, the release focused on better performance and reliability for larger codebases. Today, we’re making the 1.0RC release available, which represents the culmination of this work as a feature-complete TypeScript 1.0 language with a spec-conformant compiler and a production-level language service capable of working with codebases with hundreds of thousands of lines of code.

For developers using Visual Studio 2013, the Spring Update CTP2 includes TypeScript support, making TypeScript a first-class Visual Studio language. The TypeScript 1.0RC release is also immediately available for Visual Studio 2012 and 2013 development as a standalone power tool and as a cross-platform tool via the npm package. As always, you can access the source via CodePlex. (please note: The 1.0RC release is also called ‘0.9.7’ in the installer and compiler)

Among the usual set of bugfixes, TypeScript 1.0RC focuses on a few key areas based on user feedback on 0.9.5: a simpler type system, an improved lib.d.ts, and a more natural declaration merge order.

Simpler Type System
For the 1.0RC release, we’ve simplified the type system in two ways: the ‘any’ type now works more consistently as a wildcard, and we’ve also made generics work better with complex types, informed by real-world user examples trying to type JavaScript promises. By making these simplifications, the type system becomes easier to use and easier to reason about.

As an example, the TypeScript 1.0RC type system now allows the user to use ‘any’ as a way around typechecking when subclassing and implementing interfaces, in addition to being able to use it as a wildcard to satisfy generic constraints.

class Shape {
area: number;
}

class ImaginaryShape extends Shape {
area: any; // causes errors in 0.9.5, but valid in 1.0RC
}

Second, we’ve made it easier to understand when generic types are compatible. We’ve replaced the more complex, and error-prone, approach of 0.9.5 with the simpler rule that a generic type is compatible with another type if, once instantiated with ‘any’ for all generic type parameters, the resulting type is compatible. This allows greater flexibility when working with the types of complex generic types that occur in common JavaScript patterns, including fully-typed generic promise typings, as in this example.

interface Promise<Value> {
result: Value;

    then<T2>(f: (v: Value) => Promise<T2>): Promise<T2>;
    then<T2>(f: (v: Value) => T2): Promise<T2>;

}

class PromiseImpl<Value> implements Promise<Value> {

    result: Value;

    then<T2>(f: (v: Value) => Promise<T2>): Promise<T2>;
    then<T2>(f: (v: Value) => T2): Promise<T2>;
    then<T2>(f: (v: Value) => any): Promise<T2> {
        return undefined;
    }

}

Declaration Merging
We’ve also made declaration merging of overloads use a more natural order. Starting with TypeScript 1.0RC, overloads from later interfaces will merge before overloads of earlier interfaces. This allows you to reference a library like jQuery and then follow it with references to the jQuery plugins you want to use, and the jQuery plugins would now get the expected higher precedence during overload resolution, as in an example like this:

interface MyLib {
handleInput(x: number): void;
handleInput(x: string): void;
}
interface MyLib {
handleInput(x: Date): void;
handleInput(x: { abc: string }): void;
}

effectively becomes this definition when merged:

interface MyLib {
handleInput(x: Date): void;
handleInput(x: { abc: string }): void;
handleInput(x: number): void;
handleInput(x: string): void;
}

This new merge order also makes it easier to extend the built-in types and overloads in lib.d.ts, where the user simply needs to add the new overloads using declaration merging without having to change how lib.d.ts is initially referenced.

Improvements to lib.d.ts
A key value of TypeScript is that it offers a rich set of typings out of the box for JavaScript and DOM APIs via the lib.d.ts file that ships as part of TypeScript. With TypeScript 1.0RC, we’ve updated lib.d.ts to include typings for touch and WebGL development. This helps brings it up-to-date with the advanced HTML5 features available across platforms and devices.

Path to 1.0
It’s been an amazing journey, and your feedback on the project has helped ensure that TypeScript is a high-quality JavaScript development experience. We’d like to give a huge “thank you!” to the community that’s grown up around TypeScript as it has matured. TypeScript 1.0RC is a mature toolset, shaped by a community of users that have used TypeScript to build a rich variety of applications. We’d love to hear your feedback on this release candidate to help us make TypeScript 1.0 the best it can be.

0
0

0
Category
TypeScript
Author
Jonathan Turner [MS]
Jonathan Turner [MS]
0 comments
Discussion are closed.

Read next
April 2, 2014
Announcing TypeScript 1.0
Jonathan Turner [MS]
Jonathan Turner [MS]
May 13, 2014
Announcing TypeScript 1.0.1
Ryan Cavanaugh
Ryan Cavanaugh
Stay informed
Get notified when new posts are published.
Enter your email
Subscribe
By subscribing you agree to our Terms of Use and Privacy
Follow this blog
Stackoverflow
Feedback

What's new
Surface Pro
Surface Laptop
Surface Laptop Studio 2
Surface Laptop Go 3
Microsoft Copilot
AI in Windows
Explore Microsoft products
Windows 11 apps
Microsoft Store
Account profile
Download Center
Microsoft Store support
Returns
Order tracking
Certified Refurbished
Microsoft Store Promise
Flexible Payments
Education
Microsoft in education
Devices for education
Microsoft Teams for Education
Microsoft 365 Education
How to buy for your school
Educator training and development
Deals for students and parents
Azure for students
Business
Microsoft Cloud
Microsoft Security
Dynamics 365
Microsoft 365
Microsoft Power Platform
Microsoft Teams
Microsoft 365 Copilot
Small Business
Developer & IT
Azure
Microsoft Developer
Microsoft Learn
Explore ISV Success
Microsoft Tech Community
Azure Marketplace
AppSource
Visual Studio
Company
Careers
About Microsoft
Company news
Privacy at Microsoft
Investors
Diversity and inclusion
Accessibility
Sustainability
Your Privacy Choices
Consumer Health Privacy
Sitemap Contact Microsoft Privacy Terms of use Trademarks Safety & eco Recycling About our ads © Microsoft 2025
