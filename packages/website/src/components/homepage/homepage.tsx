import {
  Button,
  Card,
  Subtitle1,
  Text,
  Title1,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { FluentImageName, FluentImg } from "../fluent-img";
import style from "./homepage.module.css";
import { Section } from "./section/section";

const useFluentStyles = makeStyles({
  bg: { backgroundColor: tokens.colorNeutralBackground3 },
});

export const HomeContent = () => {
  const fluentStyles = useFluentStyles();

  return (
    <div className={fluentStyles.bg}>
      <Intro />
      <div className={style["sections"]}>
        <Overview />
        <OpenAPISection />
        <EcoSystemSection />
        <FlexibilitySection />
      </div>
    </div>
  );
};

const Intro = () => {
  return (
    <>
      <div className={style["intro-container"]}>
        <div className={style["intro-content"]}>
          <Title1 align="center" block={true}>
            Describe APIs at scale
          </Title1>
          <Text align="center" block={true} className={style["intro-subtitle"]}>
            Describe APIs at scale Meet TypeSpec, a language for describing APIs. Describe your data
            up front and generate schemas, API specifications, client / server code, docs, and more.
            Supports OpenAPI 3.0, JSON Schema 202-12, Protobuf, and JSON RPC
          </Text>
          <div className={style["intro-buttons"]}>
            <Button as="a" appearance="primary" href="/docs">
              Docs
            </Button>
            <Button as="a" appearance="outline">
              Try it out
            </Button>
          </div>
        </div>
        <div className={style["intro-demo"]}>
          <div className={style["intro-demo-image"]}></div>
        </div>
      </div>
    </>
  );
};

const Overview = () => {
  return (
    <>
      <div className={style["overview"]}>
        <div className={style["overview-summary"]}>
          <Title2 block={true}>API-First for developers</Title2>
          <Text block={true} className={style["overview-description"]}>
            Don't let the nitty-gritty details of an API protocol get in the way of prioritizing
            your design. With TypeSpec, remove the handwritten files that slow you down, and
            generate standards-compliant API schemas in seconds.
          </Text>
        </div>
        <div className={style["overview-points"]}>
          <Feature title="Describe complex APIs, fast" image="editor">
            Reduce the time it takes to describe complex API shapes by using a minimal language
            that's easy for developers to use and love.
          </Feature>
          <Feature title="Codify your API guidelines" image="people-shield">
            All the benefits of API review, built into your dev workflow. Codify your team's API
            guidelines and catch errors at development time.
          </Feature>
          <Feature title="Generate assets in many formats" image="firework">
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
  image: FluentImageName;
  children: React.ReactNode;
}
const Feature = ({ title, image, children }: FeatureProps) => {
  return (
    <Card size="large">
      <div className={style["feature"]}>
        <FluentImg name={image} />
        <Subtitle1>{title}</Subtitle1>
        <Text>{children}</Text>
      </div>
    </Card>
  );
};

const OpenAPISection = () => {
  return (
    <Section
      header="Productivity"
      title="Streamline your OpenAPI workflow"
      description="Benefit from a huge ecosystem of OpenAPI tools for configuring API gateways, generating code, and validating your data."
      items={[
        {
          title: "TypeSpec for OpenAPI developers",
          description: "Description todo",
          image: "design",
          link: "todo",
        },
        {
          title: "Title",
          description: "Description todo",
          image: "checkmark",
          link: "todo",
        },
      ]}
    />
  );
};

const EcoSystemSection = () => {
  return (
    <Section
      header="Ecosystem"
      title="Test API endpoints as you code"
      description="Build a complete JSON RPC interface for your service, call it from your web browser, and test out endpoints in a breeze."
      items={[
        {
          title: "TypeSpec for JSON RPC developer",
          description: "Description todo",
          image: "design",
          link: "todo",
        },
      ]}
    />
  );
};

const FlexibilitySection = () => {
  return (
    <Section
      header="Ecosystem"
      title="Action-oriented title todo"
      description="With TypeSpec, align your team around a common type vocabulary. "
      items={[
        {
          title: "Title todo",
          description: "Description todo",
          image: "design",
          link: "todo",
        },
        {
          title: "Title todo",
          description: "Description todo",
          image: "chat",
          link: "todo",
        },
      ]}
    />
  );
};
