import { Container, Box } from "@mantine/core";

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box pt="md">
      <Container size="md" px="sm">
        {children}
      </Container>
    </Box>
  );
}
