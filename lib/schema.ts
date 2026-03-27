const SITE_NAME = 'PowerBillPeek';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://powerbillpeek.com';

export function datasetSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'US Electricity Rates by State',
    description: 'Average electricity rates, monthly bills, and utility costs for all 50 US states based on EIA data.',
    url: SITE_URL,
    creator: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    temporalCoverage: '2024',
    spatialCoverage: {
      '@type': 'Place',
      name: 'United States',
    },
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Residential Electricity Rate', unitText: 'cents per kWh' },
      { '@type': 'PropertyValue', name: 'Average Monthly Bill', unitText: 'USD' },
    ],
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function webPageSchema(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${SITE_URL}${url}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    dateModified: new Date().toISOString(),
  };
}
