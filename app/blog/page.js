import { client } from '../../sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import BlogList from './BlogList';

const builder = imageUrlBuilder(client);

export const revalidate = 60;

export const metadata = {
  title: 'Blog — Perfume Guides, Reviews & Layering Tips | The Dry Down',
  description: 'Editorial content about fragrance — perfume of the month, seasonal picks, layering guides, and deep dives into notes and accords for the GCC perfume community.',
  keywords: 'perfume blog, fragrance guide, perfume of the month, layering guide, seasonal perfume, arabic perfume blog',
  openGraph: {
    title: 'Blog — The Dry Down',
    description: 'Guides, reviews, and editorial picks from the GCC fragrance community.',
    type: 'website',
  },
  alternates: { canonical: 'https://www.thedrydown.io/blog' },
};

const POSTS_QUERY = `*[_type == "blogPost" && status == "published"] | order(publishedAt desc)[0...50] {
  "id": _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  "cover_image": coverImage.asset->url,
  author,
  "published_at": publishedAt,
  "reading_time": readingTime,
  featured
}`;

export default async function BlogPage() {
  const posts = await client.fetch(POSTS_QUERY);
  return <BlogList posts={posts || []} />;
}
