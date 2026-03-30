'use client'

interface FakePageContentProps {
  pagePath: string
  pageTitle: string
}

const pageContent: Record<string, { heading: string; body: React.ReactNode }> = {
  '/': {
    heading: 'Welcome to Chartwell Retirement Residences',
    body: (
      <div className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          Chartwell is Canada&apos;s largest provider of senior living communities. We offer a warm,
          caring environment where residents can enjoy a fulfilling, independent lifestyle with the
          support they need.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-6">
          {['Independent Living', 'Assisted Living', 'Memory Care'].map((s) => (
            <div key={s} className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
              <p className="text-xs font-semibold text-amber-800">{s}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  '/retirement-living': {
    heading: 'Retirement Living Options',
    body: (
      <div className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          Our retirement living communities offer comfortable suites, hotel-like amenities, and a
          vibrant social calendar to help you enjoy the best years of your life.
        </p>
        <ul className="text-sm text-gray-600 space-y-2">
          {['Studio, 1BR & 2BR suites available', 'All-inclusive dining packages', 'Concierge services', 'Housekeeping & laundry'].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  '/pricing': {
    heading: 'Pricing & Fees',
    body: (
      <div className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          Explore our transparent pricing options designed to fit a variety of budgets. All packages
          include meals, activities, and 24-hour support.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { tier: 'Studio Suite', price: '$3,200/mo' },
            { tier: '1 Bedroom', price: '$4,100/mo' },
            { tier: '2 Bedroom', price: '$5,400/mo' },
            { tier: 'Premium Suite', price: '$6,800/mo' },
          ].map((p) => (
            <div key={p.tier} className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">{p.tier}</p>
              <p className="font-semibold text-gray-800 text-sm mt-0.5">{p.price}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  '/dining': {
    heading: 'Dining Options',
    body: (
      <div className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          Our culinary team prepares fresh, nutritious meals daily using locally sourced ingredients.
          Enjoy restaurant-style dining with menu variety and special dietary accommodations.
        </p>
        <div className="space-y-2">
          {['Chef-prepared breakfast, lunch & dinner', 'Private dining room for family events', 'Special dietary needs accommodated', 'Snacks & beverages available 24/7'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-amber-500">✦</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  '/medical': {
    heading: 'Medical Services',
    body: (
      <div className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          Chartwell provides access to a full spectrum of health services including 24-hour nursing
          support, medication management, and on-site physiotherapy.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {['24/7 nursing staff', 'Medication management', 'Physiotherapy', 'Visiting physicians', 'Dental care', 'Vision care'].map((s) => (
            <div key={s} className="bg-blue-50 rounded px-3 py-1.5 text-xs text-blue-700 font-medium">{s}</div>
          ))}
        </div>
      </div>
    ),
  },
  '/activities': {
    heading: 'Activities & Events',
    body: (
      <div className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          Stay active and engaged with our diverse calendar of social, recreational, and wellness
          programs designed to enrich your daily life.
        </p>
        <div className="space-y-1.5">
          {['Morning fitness classes', 'Arts & crafts workshops', 'Movie nights & live entertainment', 'Garden club & outdoor excursions', 'Card games & trivia nights'].map((a) => (
            <div key={a} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
              {a}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  '/contact': {
    heading: 'Contact Us',
    body: (
      <div className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          Our friendly team is here to answer your questions and help you find the right community.
          Book a tour today — no pressure, just a conversation.
        </p>
        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-medium">Phone:</span> 1-855-461-0685</p>
          <p><span className="font-medium">Email:</span> info@chartwell.com</p>
          <p><span className="font-medium">Hours:</span> Mon–Fri 8am–8pm, Sat–Sun 9am–5pm</p>
        </div>
      </div>
    ),
  },
}

export default function FakePageContent({ pagePath, pageTitle }: FakePageContentProps) {
  const content = pageContent[pagePath] ?? {
    heading: pageTitle || 'Page Not Found',
    body: (
      <p className="text-gray-600 text-sm">Content for this page is not available in the simulator.</p>
    ),
  }

  return (
    <div className="p-6 flex-1 overflow-y-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">{content.heading}</h1>
      {content.body}
    </div>
  )
}
