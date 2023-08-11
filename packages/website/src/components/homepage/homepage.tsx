import { Button, Card, Subtitle1, Text, Title1, Title2 } from "@fluentui/react-components";
import describeImg from "@site/static/img/fluent/0557-editor-d-standard-128x128.png";
import guidelinesImg from "@site/static/img/fluent/0373-people-shield-d-standard-128x128.png";
import generateImg from "@site/static/img/fluent/0377-firework-d-standard-128x128.png";

import "./homepage.css";

export const HomeContent = () => {
  return (
    <>
      <Intro />
      <div className="sections">
        <Overview />
      </div>
    </>
  );
};

const Intro = () => {
  return (
    <>
      <div className="intro-container">
        <div className="intro-content">
          <Title1 align="center" block={true}>
            Describe APIs at scale
          </Title1>
          <Text align="center" block={true} className="intro-subtitle">
            Describe APIs at scale Meet TypeSpec, a language for describing APIs. Describe your data
            up front and generate schemas, API specifications, client / server code, docs, and more.
            Supports OpenAPI 3.0, JSON Schema 202-12, Protobuf, and JSON RPC
          </Text>
          <div className="intro-buttons">
            <Button as="a" appearance="primary" href="/docs">
              Docs
            </Button>
            <Button as="a" appearance="outline">
              Try it out
            </Button>
          </div>
        </div>
        <div className="intro-demo">
          <div className="intro-demo-image"></div>
        </div>
      </div>
    </>
  );
};

const Overview = () => {
  return (
    <>
      <div className="overview">
        <div className="overview-summary">
          <Title2 block={true}>API-First for developers</Title2>
          <Text block={true} className="overview-description">
            Don't let the nitty-gritty details of an API protocol get in the way of prioritizing
            your design. With TypeSpec, remove the handwritten files that slow you down, and
            generate standards-compliant API schemas in seconds.
          </Text>
        </div>
        <div className="overview-points">
          <Feature title="Describe complex APIs, fast" image={describeImg}>
            Reduce the time it takes to describe complex API shapes by using a minimal language
            that's easy for developers to use and love.
          </Feature>
          <Feature title="Codify your API guidelines" image={guidelinesImg}>
            All the benefits of API review, built into your dev workflow. Codify your team's API
            guidelines and catch errors at development time.
          </Feature>
          <Feature title="Generate assets in many formats" image={generateImg}>
            With a single line of code, generate a multitude of API assets in your preferred format
            or protocol - even all at the same time.
          </Feature>
        </div>
      </div>
    </>
  );
};

interface FeatureProps {
  title: string;
  image: string;
  children: React.ReactNode;
}
const Feature = ({ title, image, children }: FeatureProps) => {
  return (
    <Card size="large">
      <div className="feature">
        <img src={image} />
        <Subtitle1>{title}</Subtitle1>
        <Text>{children}</Text>
      </div>
    </Card>
  );
};
