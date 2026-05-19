import Head from 'next/head'

export default function SEO({ title, description, url, image }){
  const metaUrl = url || 'https://www.sreevenkatesswaraconstructions.com'
  const metaImage = image || '/logo.svg'
  const keywords = 'Construction company, Interior designers, Luxury home builders, Villa construction, Construction and interiors'
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <link rel="canonical" href={metaUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context":"https://schema.org",
        "@type":"Organization",
        "name":"Sree Venkatesswara Constructions & Interiors",
        "url":metaUrl,
        "logo":metaImage,
        "sameAs":["https://www.facebook.com","https://www.instagram.com"]
      })}} />
    </Head>
  )
}
