import { Container, Box } from "@mantine/core";
import { PublicHeader } from "@/components/PublicHeader";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box pt="xl">
      <PublicHeader />
      <Container size="full" px="md" style={{ maxWidth: "var(--content-max)" }}>
        {children}
      </Container>
    </Box>
  );
}
