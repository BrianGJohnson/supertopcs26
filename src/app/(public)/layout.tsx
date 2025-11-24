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
      <Container size="lg" px="md">
        {children}
      </Container>
    </Box>
  );
}
