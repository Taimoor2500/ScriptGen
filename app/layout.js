import "./globals.css";

export const metadata = {
  title: "ScriptGen — AI Video Script Generator",
  description:
    "Generate ready-to-record video scripts from a single idea. Pick a tone and target length, and let Claude do the rest.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
