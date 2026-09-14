import "./globals.css";

export const metadata = {
  title: "Spend It Wisely",
  description: "Smart personal money management"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
