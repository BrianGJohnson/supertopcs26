import { Stack, Box } from '@mantine/core';
import { PublicHeader } from '@/components/PublicHeader';
import { SiteFooter } from './SiteFooter';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <Stack gap="xl" mih="100vh">
      <PublicHeader />
      <Box style={{ flex: 1 }}>
        {children}
      </Box>
      <SiteFooter />
    </Stack>
  );
}
