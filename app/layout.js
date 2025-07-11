import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata = {
  title: "UW-Madison Course Selector",
  description: "Smart course selection app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
