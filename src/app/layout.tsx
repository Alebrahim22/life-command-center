import type { Metadata } from "next"
import { Inter, Fira_Code, Tajawal } from "next/font/google"
import "./globals.css"
import { I18nProvider } from "@/lib/i18n"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  display: "swap",
})

const tajawal = Tajawal({
  weight: ["300", "400", "500", "700"],
  variable: "--font-tajawal",
  subsets: ["arabic"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Life Command Center",
  description: "Your personal operations hub — dashboard, finances, habits & more",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%2322c55e'/><text x='16' y='22' text-anchor='middle' fill='white' font-size='18' font-weight='bold' font-family='Inter'>LC</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${firaCode.variable} ${tajawal.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('lcc-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  var locale = localStorage.getItem('lcc-locale') || 'ar';
                  document.documentElement.lang = locale;
                  document.documentElement.dir = locale === 'en' ? 'ltr' : 'rtl';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
