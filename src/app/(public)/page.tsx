import { Stack, Title, Text } from '@mantine/core';

export default function HomePage() {
  return (
    <Stack align="center" justify="center" spacing="md" mt="xl">
      <Title
        order={1}
        className="heroGradient"
        align="center"
        fw={900}
        style={{ fontSize: 84, lineHeight: 1.12 }}
      >
        Stop Guessing.<br style={{ margin: 0, padding: 0, lineHeight: 0 }} />
        <span style={{ display: 'block', marginTop: -8 }}>Start Growing.</span>
      </Title>
      <Text size="xl" align="center">
        The fastest path to YouTube success comes from identifying the right topic, a Super Topic.
      </Text>
    </Stack>
  );
}
