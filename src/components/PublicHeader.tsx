import Link from "next/link";
import { Container, Group, Text } from "@mantine/core";

export function PublicHeader() {
  return (
    <Container size="lg" px="md" py="md">
      <Group justify="space-between">
        <Text size="xl" fw={700}>
          SuperTopics
        </Text>
        <Group gap="lg">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            Home
          </Link>
          <Link href="/blog" style={{ textDecoration: "none", color: "inherit" }}>
            Blog
          </Link>
          <Link href="/pricing" style={{ textDecoration: "none", color: "inherit" }}>
            Pricing
          </Link>
          <Link href="/demo" style={{ textDecoration: "none", color: "inherit" }}>
            Demo
          </Link>
        </Group>
      </Group>
    </Container>
  );
}
