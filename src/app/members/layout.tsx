import { Container, Box } from "@mantine/core";

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box pt="md">
      <Container size="md" px="sm" style={{ maxWidth: "var(--content-max)" }}>
        {children}
      </Container>
    </Box>
  );
}
