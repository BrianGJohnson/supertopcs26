import { HeroSection } from '@/components/marketing/HeroSection';
import { Stack, Box, Title, Text, Container } from '@mantine/core';

export default function HomePage() {
  return (
    <Stack gap={80}>
      <HeroSection />
      
      <Container size="md">
        <Stack gap="lg">
          <Title order={2} ta="center">Typography Scale</Title>
          <Stack gap="md">
            <Box>
              <Title order={1}>Heading 1: The Quick Brown Fox</Title>
              <Text size="sm" c="dimmed">Size: var(--font-h1-size) | Weight: 800</Text>
            </Box>
            <Box>
              <Title order={2}>Heading 2: Jumps Over The Lazy Dog</Title>
              <Text size="sm" c="dimmed">Size: var(--font-h2-size) | Weight: 800</Text>
            </Box>
            <Box>
              <Title order={3}>Heading 3: A Super Topic Strategy</Title>
              <Text size="sm" c="dimmed">Size: 1.75rem (Mantine default) | Weight: 700</Text>
            </Box>
            <Box>
              <Title order={4}>Heading 4: Component Driven UI</Title>
              <Text size="sm" c="dimmed">Size: 1.5rem (Mantine default) | Weight: 700</Text>
            </Box>
          </Stack>

          <Stack gap="md" mt="xl">
            <Title order={2} ta="center">Body Text Scale</Title>
            <Box>
              <Text size="xl">Body XL: This is extra large body text used for leads.</Text>
              <Text size="sm" c="dimmed">Size: var(--font-body-size)</Text>
            </Box>
            <Box>
              <Text size="md">Body MD: This is the standard body text size for most content paragraphs. It should be readable and have good contrast.</Text>
              <Text size="sm" c="dimmed">Size: 1rem (Mantine default)</Text>
            </Box>
            <Box>
              <Text size="sm">Body SM: This is small text often used for secondary information, captions, or less important details.</Text>
              <Text size="sm" c="dimmed">Size: 0.875rem (Mantine default)</Text>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );
}
