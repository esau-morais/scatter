import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface WaitlistWelcomeProps {
  email: string;
}

const config = {
  theme: {
    extend: {
      colors: {
        coral: "#E85D3D",
        "coral-light": "#FF7A5C",
        slate: {
          900: "#0F0F12",
          800: "#1A1A1F",
          700: "#2A2A32",
          400: "#9CA3AF",
          300: "#D1D5DB",
        },
      },
    },
  },
};

export const WaitlistWelcome = ({ email }: WaitlistWelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <title>Welcome to Scatter</title>
      <meta name="color-scheme" content="dark" />
      <meta name="supported-color-schemes" content="dark" />
    </Head>
    <Preview>
      You're in! Welcome to Scatter — Write once, scatter everywhere.
    </Preview>
    <Tailwind config={config}>
      <Body className="m-0 bg-slate-900 p-0 font-sans">
        <Container className="mx-auto max-w-[520px] px-4 py-10">
          {/* Header with Logo */}
          <Section className="mb-8 text-center">
            <table cellPadding="0" cellSpacing="0" style={{ margin: "0 auto" }}>
              <tr>
                <td
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#E85D3D",
                    borderRadius: "10px",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>✦</span>
                </td>
              </tr>
            </table>
            <Text className="m-0 mt-4 text-xl font-bold tracking-tight text-white">
              Scatter
            </Text>
          </Section>

          {/* Main Card */}
          <Section
            className="rounded-2xl px-8 py-10"
            style={{
              backgroundColor: "#1A1A1F",
              border: "1px solid #252529",
            }}
          >
            {/* Status Badge */}
            <table
              cellPadding="0"
              cellSpacing="0"
              style={{ margin: "0 auto 24px" }}
            >
              <tr>
                <td
                  style={{
                    backgroundColor: "#2D1915",
                    border: "1px solid #5C2C22",
                    borderRadius: "9999px",
                    padding: "6px 16px",
                  }}
                >
                  <Text className="m-0 text-xs font-medium text-coral">
                    ● YOU'RE ON THE LIST
                  </Text>
                </td>
              </tr>
            </table>

            <Heading className="m-0 mb-4 text-center text-2xl font-bold leading-tight text-white">
              The future of <span className="text-coral">content</span> is here
            </Heading>

            <Text className="m-0 mb-6 text-center text-base leading-relaxed text-slate-400">
              One idea. Four platforms. Seconds.
            </Text>

            <Hr className="my-6" style={{ borderColor: "#252529" }} />

            <Text className="m-0 mb-2 text-sm text-slate-400">
              Registered email
            </Text>
            <Text
              className="m-0 mb-6 font-mono text-base text-white"
              style={{
                backgroundColor: "#1D1D22",
                padding: "12px 16px",
                borderRadius: "8px",
              }}
            >
              {email}
            </Text>

            <Text className="m-0 text-sm leading-relaxed text-slate-400">
              We'll notify you the moment Scatter launches. Get ready to write
              once and scatter your ideas everywhere.
            </Text>
          </Section>

          {/* Footer */}
          <Section className="mt-8 text-center">
            <Text className="m-0 mb-4 text-xs text-slate-400">
              © 2025 Scatter · Write once, distribute everywhere.
            </Text>
            <Text className="m-0 text-xs leading-relaxed text-slate-400">
              This is a confirmation of your waitlist signup.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

WaitlistWelcome.PreviewProps = {
  email: "creator@example.com",
} as WaitlistWelcomeProps;

export default WaitlistWelcome;
