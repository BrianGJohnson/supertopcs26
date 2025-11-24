import { Stack, Title, Text } from '@mantine/core';

export default function HomePage() {
  return (
    <Stack align="center" justify="center" spacing={20} mt="xl">
      <h1
        className="heroGradient"
        style={{ fontSize: 84, fontWeight: 900, lineHeight: 1.15, textAlign: "center" }}
      >
        <span style={{ display: "block", marginBottom: 8 }}>Stop Guessing.</span>
        <span style={{ display: "block" }}>Start Growing.</span>
      </h1>
      <Text size="xl" align="center" style={{ fontSize: 24, lineHeight: 1.4, color: "#E3E7EC" }}>
        You’ve heard it before. If they don’t click, they don’t watch. If they don’t watch, you can’t grow. The simplest path to YouTube success is identifying a great topic, a Super Topic.
      </Text>
    </Stack>
  );
}
