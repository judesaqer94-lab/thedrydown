import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: (rule) => rule.required() }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'category', title: 'Category', type: 'string', options: { list: [
      { title: 'Perfume of the Month', value: 'perfume-of-the-month' },
      { title: 'Seasonal Picks', value: 'seasonal' },
      { title: 'Layering Guides', value: 'layering' },
      { title: 'Note Deep Dives', value: 'notes' },
      { title: 'GCC Picks', value: 'gcc' },
      { title: 'Guides', value: 'guide' },
    ]}, validation: (rule) => rule.required() }),
    defineField({ name: 'author', title: 'Author', type: 'string', initialValue: 'The Dry Down' }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [
      { type: 'block', styles: [
        { title: 'Normal', value: 'normal' }, { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' }, { title: 'Quote', value: 'blockquote' },
      ], marks: { decorators: [{ title: 'Bold', value: 'strong' }, { title: 'Italic', value: 'em' }],
        annotations: [{ name: 'link', type: 'object', title: 'Link', fields: [{ name: 'href', type: 'url', title: 'URL' }] }] } },
      { type: 'image', options: { hotspot: true }, fields: [
        { name: 'alt', type: 'string', title: 'Alt Text' }, { name: 'caption', type: 'string', title: 'Caption' }] },
      { name: 'perfumeEmbed', title: 'Perfume Card', type: 'object', fields: [
        { name: 'perfumeId', title: 'Perfume ID (from Supabase)', type: 'number', validation: (rule) => rule.required() },
        { name: 'perfumeName', title: 'Perfume Name (for preview)', type: 'string' }],
        preview: { select: { title: 'perfumeName', id: 'perfumeId' }, prepare({ title, id }) { return { title: `${title || 'Perfume'} (ID: ${id})` } } } },
      { name: 'tipBlock', title: 'Tip / Callout', type: 'object', fields: [
        { name: 'text', title: 'Tip Text', type: 'text', rows: 3, validation: (rule) => rule.required() }],
        preview: { select: { title: 'text' }, prepare({ title }) { return { title: `${title?.substring(0, 60)}...` } } } },
    ] }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'featured', title: 'Featured Post', type: 'boolean', initialValue: false }),
    defineField({ name: 'readingTime', title: 'Reading Time (minutes)', type: 'number', initialValue: 5 }),
    defineField({ name: 'status', title: 'Status', type: 'string', options: { list: [
      { title: 'Draft', value: 'draft' }, { title: 'Published', value: 'published' }] }, initialValue: 'draft' }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 2 }),
  ],
  preview: { select: { title: 'title', media: 'coverImage', status: 'status' },
    prepare({ title, media, status }) { return { title: `${status === 'published' ? '✅' : '📝'} ${title}`, media } } },
})
