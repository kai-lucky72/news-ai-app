import './globals.css';
import Header from './Header';

export const metadata = {
  title: 'Parrot',
  description: 'AI-powered news and social media manager',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-primary font-sans">
        <Header />
        <main className="max-w-7xl mx-auto p-6 w-full">
        {children}
        </main>
        <footer className="w-full py-6 text-center text-gray-400 text-sm bg-white border-t mt-12">&copy; {new Date().getFullYear()} Parrot. All rights reserved.</footer>
      </body>
    </html>
  );
}
