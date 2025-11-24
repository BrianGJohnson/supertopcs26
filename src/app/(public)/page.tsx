import { Stack, Title, Text } from '@mantine/core';

export default function HomePage() {
  return (
    <Stack align="center" justify="center" spacing="md" mt="xl">
      <Title order={1} className="heroGradient" align="center">
        SuperTopics Placeholder
      </Title>
      <Text size="lg" align="center">
        Bold public hero headline with gradient accents, calm supporting copy.
      </Text>
    </Stack>
  );
}
