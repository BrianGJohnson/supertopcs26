"use client";

import Image from "next/image";
import Link from "next/link";
import { Container, Group, Text } from "@mantine/core";

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
						<Text
							key={item.href}
							component={Link}
							href={item.href}
							c="var(--text-primary)"
							style={{
								fontSize: "var(--font-nav-size)",
								fontWeight: "var(--font-nav-weight)",
								textDecoration: "none",
							}}
						>
							{item.label}
						</Text>
					))}
				</Group>
			</Group>
		</Container>
	);
}
