import Image from "next/image";
import Link from "next/link";
import { Container, Group } from "@mantine/core";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Demo" },
];

export function PublicHeader() {
  return (
    <Container size="lg" px="md" py="md">
      <Group justify="space-between" align="center">
        <Link href="/">
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
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="publicNavLink">
              {item.label}
            </Link>
          ))}
        </Group>
      </Group>
    </Container>
  );
}
