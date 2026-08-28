import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getPostBySlug, getRelatedPosts, type ContentBlock } from "@/lib/blog/posts";
import Breadcrumb from "../../components/blog/Breadcrumb";
import ShareBookmark from "../../components/blog/ShareBookmark";
import PostMeta from "../../components/blog/PostMeta";
import CategoryBadge from "../../components/blog/CategoryBadge";
import ArticleBody from "../../components/blog/ArticleBody";
import HelpfulPrompt from "../../components/blog/HelpfulPrompt";
import AuthorCard from "../../components/blog/AuthorCard";
import TableOfContents from "../../components/blog/TableOfContents";
import RelatedArticles from "../../components/blog/RelatedArticles";
import CtaBanner from "../../components/blog/CtaBanner";
import NewsletterForm from "../../components/blog/NewsletterForm";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const toc = post.content
    .filter((b): b is Extract<ContentBlock, { type: "heading" }> => b.type === "heading")
    .map((b) => ({ id: b.id, text: b.text }));

  const related = getRelatedPosts(post);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-24 sm:px-6">
      <Breadcrumb title={post.title} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Article column */}
        <article className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            {post.featured && (
              <span className="inline-flex items-center rounded-full bg-violet px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                Featured
              </span>
            )}
            <div className="ml-auto shrink-0">
              <ShareBookmark title={post.title} />
            </div>
          </div>

          <h1 className="mt-4 font-display text-[28px] font-semibold leading-tight text-ink sm:text-[36px]">{post.title}</h1>
          <p className="mt-3 max-w-2xl font-sans text-[15px] leading-relaxed text-ink-muted">{post.excerpt}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <PostMeta readTime={post.readTime} date={post.date} />
            <CategoryBadge category={post.category} />
          </div>

          <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl">
            <img src={post.coverImage} alt="" className="h-full w-full object-cover" />
          </div>

          <div className="mt-8">
            <ArticleBody blocks={post.content} />
          </div>

          <HelpfulPrompt />
        </article>

        {/* Sidebar */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          {/* <AuthorCard author={post.author} /> */}
          <TableOfContents entries={toc} />
          <RelatedArticles posts={related} />
          <CtaBanner variant="vertical" />
          <NewsletterForm />
        </aside>
      </div>
    </main>
  );
}
