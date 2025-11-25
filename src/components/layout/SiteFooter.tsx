"use client";

import { Box, Container, Group, Text, Anchor, Stack } from '@mantine/core';
import Link from 'next/link';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" py="xl" mt="auto" style={{ borderTop: '1px solid var(--mantine-color-dark-6)' }}>
      <Container size="lg" px="md">
        <Stack gap="xl">
          <Group justify="space-between" align="center">
            <Text fw={700} size="lg" c="var(--text-primary)">Super Topics</Text>
            <Group gap="lg">
              <Anchor component={Link} href="#" c="dimmed" size="sm">Docs</Anchor>
              <Anchor component={Link} href="#" c="dimmed" size="sm">Changelog</Anchor>
              <Anchor component={Link} href="#" c="dimmed" size="sm">Status</Anchor>
            </Group>
          </Group>
          <Text c="dimmed" size="sm" ta="center">
            © {currentYear} Super Topics. All rights reserved.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
