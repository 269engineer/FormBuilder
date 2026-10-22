import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formly API",
  description: "Backend API for the Formly form builder",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
