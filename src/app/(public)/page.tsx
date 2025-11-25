import { Stack, Title, Text } from '@mantine/core';

export default function HomePage() {
  return (
    <Stack align="center" justify="center" spacing={20} mt="xl" className="heroStack">
      <h1
        className="heroHeadline"
        style={{
          fontSize: "var(--font-h1-size)",
          fontWeight: "var(--font-h1-weight)",
          lineHeight: "var(--line-h1)",
          textAlign: "center",
        }}
      >
        <span style={{ marginBottom: 8 }}>Stop Guessing.</span>
        <span>Start Growing.</span>
      </h1>
      <Text
        size="xl"
        align="center"
        style={{
          fontSize: "var(--font-body-size)",
          lineHeight: "var(--line-body)",
          color: "var(--text-secondary)",
        }}
      >
        You’ve heard it before. If they don’t click, they don’t watch. If they don’t watch, you can’t grow. The simplest path to YouTube success is identifying a great topic, a Super Topic.
      </Text>
    </Stack>
  );
}
