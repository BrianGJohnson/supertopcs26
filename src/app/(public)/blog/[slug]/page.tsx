import { Container, Title, Text } from '@mantine/core';

interface Params {
  params: { slug: string };
}

export default function BlogPostPage({ params }: Params) {
  return (
    <Container>
      <Title>Blog post placeholder</Title>
      <Text>Post slug: {params.slug}</Text>
      <Text>This will be the single post page in future iterations.</Text>
    </Container>
  );
}
