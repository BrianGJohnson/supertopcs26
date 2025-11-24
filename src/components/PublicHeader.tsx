import Image from "next/image";
import Link from "next/link";
import { Container, Group } from "@mantine/core";

export function PublicHeader() {
  return (
    <Container size="lg" px="md" py="md">
      <Group justify="space-between" align="center">
        <Link href="/" style={{ textDecoration: "none" }}>
          <Image
            src="/branding/logo-horizontal-2400.png"
            alt="Super Topics"
            width={2400}
            height={800}
            className="publicHeaderLogo"
            priority
          />
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
