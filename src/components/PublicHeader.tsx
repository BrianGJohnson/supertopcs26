import Link from "next/link";
import { Container, Group, Text } from "@mantine/core";

export function PublicHeader() {
  return (
    <Container size="lg" px="md" py="md">
      <Group justify="space-between" align="center">
        <Link href="/" style={{ textDecoration: "none" }}>
          <Group gap={4} align="center">
            <Text
              fw={800}
              span
              style={{ color: "#E7ECF5", letterSpacing: "-1px", fontSize: 28 }}
            >
              Super
            </Text>
            <Text
              fw={900}
              className="heroGradient"
              span
              style={{ letterSpacing: "-1px", fontSize: 28 }}
            >
              Topics
            </Text>
          </Group>
        </Link>
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
